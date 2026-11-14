// Exercises scripts/setup_wallet.sql on a real Postgres engine (PGlite), with
// auth.uid() stubbed from a session setting. No credentials, no network.
// Usage: node tests/wallet-db.mjs [/abs/path/package.json with @electric-sql/pglite]
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const require = createRequire(process.argv[2] || import.meta.url)
const { PGlite } = require('@electric-sql/pglite')
const db = new PGlite()
const read = file => readFile(new URL(`../scripts/${file}`, import.meta.url), 'utf8')
try {
  await db.exec(`CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
    CREATE ROLE authenticated;`)
  await db.exec((await read('setup_db.sql')).split('-- SEED DATA:')[0])
  await db.exec((await read('migrate_visual_lessons.sql')).split('-- SEED:')[0])
  const family = '00000000-0000-4000-8000-000000000001', other = '00000000-0000-4000-8000-000000000002'
  const course = '00000000-0000-4000-8000-000000000003', lesson = '00000000-0000-4000-8000-000000000004', lesson2 = '00000000-0000-4000-8000-000000000005'
  await db.exec(`INSERT INTO auth.users VALUES ('${family}'),('${other}');
    INSERT INTO courses(id,slug,title,language_from,language_to) VALUES ('${course}','test','Test','en','es');
    INSERT INTO lessons(id,course_id,lesson_number,title) VALUES ('${lesson}','${course}',1,'One'),('${lesson2}','${course}',2,'Two');`)
  await db.exec(await read('migrate_child_profiles.sql'))
  const wallet = await read('setup_wallet.sql')
  await db.exec(wallet); await db.exec(wallet)
  const as = uid => db.exec(`SELECT set_config('test.uid', '${uid || ''}', false)`)
  await as(family)
  const [rush] = (await db.query(`INSERT INTO profiles(user_id,name) VALUES ($1,'Rush') RETURNING id`, [family])).rows
  const [parent] = (await db.query(`SELECT id FROM profiles WHERE user_id=$1 AND role='parent'`, [family])).rows
  const award = async (kind, lessonId, profile = rush.id) => (await db.query(`SELECT * FROM award_wallet($1,$2,$3)`, [profile, kind, lessonId])).rows[0]

  assert.deepEqual(await award('lesson', lesson), { cents: 10, earned_today: 10, cap: 50 }, 'first lesson pays 10')
  assert.deepEqual(await award('lesson', lesson), { cents: 5, earned_today: 15, cap: 50 }, 'replay pays 5')
  assert.equal((await award('practice', null)).cents, 10, 'practice pays 10')
  assert.equal((await award('practice', null)).cents, 10, 'practice pays 10 again')
  assert.equal((await award('lesson', lesson2)).cents, 10, 'another lesson, first time')
  assert.deepEqual(await award('practice', null), { cents: 5, earned_today: 50, cap: 50 }, 'cap trims the last award')
  assert.deepEqual(await award('practice', null), { cents: 0, earned_today: 50, cap: 50 }, 'nothing over the cap')
  assert.equal((await db.query(`SELECT count(*)::int AS n FROM wallet_entries WHERE cents = 0`)).rows[0].n, 0, 'no zero rows')

  // Yesterday's earnings do not count toward today; adjustments never do.
  await db.query(`UPDATE wallet_entries SET created_at = created_at - interval '1 day' WHERE profile_id = $1`, [rush.id])
  await db.query(`INSERT INTO wallet_entries(user_id,profile_id,cents,kind,reason) VALUES ($1,$2,-20,'adjustment','bought a toy')`, [family, rush.id])
  await db.query(`INSERT INTO wallet_entries(user_id,profile_id,cents,kind,reason) VALUES ($1,$2,100,'adjustment','birthday')`, [family, rush.id])
  assert.equal((await award('lesson', lesson)).cents, 5, 'new day: replay again, cap reset')
  const [summary] = (await db.query(`SELECT * FROM wallet_summary()`)).rows
  assert.deepEqual(summary, { profile_id: rush.id, balance: 135, earned_today: 5, cap: 50 }, 'balance includes adjustments, today excludes them')

  await assert.rejects(db.query(`INSERT INTO wallet_entries(user_id,profile_id,cents,kind,reason) VALUES ($1,$2,5,'adjustment','  ')`, [family, rush.id]), /wallet_adjustment_reason/, 'adjustment needs a reason')
  await assert.rejects(award('lesson', null), /needs a lesson/)
  await assert.rejects(award('bonus', null), /unknown award kind/)
  await assert.rejects(award('practice', null, parent.id), /not your child/, 'parent profiles earn nothing')
  await as(other)
  await assert.rejects(award('practice', null), /not your child/, 'another family cannot award this child')
  assert.equal((await db.query(`SELECT count(*)::int AS n FROM wallet_summary()`)).rows[0].n, 0)
  console.log('PASS: setup_wallet.sql applies twice; 10/5/10 cents, 50 cent cap, Chicago day reset, adjustments in balance not cap, reason required, child-only, family-scoped')
} finally { await db.close() }
