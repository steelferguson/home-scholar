import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const require = createRequire(process.argv[2] || import.meta.url)
const { PGlite } = require('@electric-sql/pglite')
const db = new PGlite()
try {
  await db.exec(`CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT null::uuid $$;`)
  const base = await readFile(new URL('../scripts/setup_db.sql', import.meta.url), 'utf8')
  const visual = await readFile(new URL('../scripts/migrate_visual_lessons.sql', import.meta.url), 'utf8')
  await db.exec(base.split('-- SEED DATA:')[0])
  await db.exec(visual.split('-- SEED:')[0])
  const family = '00000000-0000-4000-8000-000000000001', other = '00000000-0000-4000-8000-000000000002'
  const course = '00000000-0000-4000-8000-000000000003', lesson = '00000000-0000-4000-8000-000000000004'
  await db.exec(`INSERT INTO auth.users VALUES ('${family}'),('${other}'); INSERT INTO courses(id,slug,title,language_from,language_to) VALUES ('${course}','test','Test','en','es'); INSERT INTO lessons(id,course_id,lesson_number,title) VALUES ('${lesson}','${course}',1,'Test'); INSERT INTO user_progress(user_id,lesson_id,status) VALUES ('${family}','${lesson}','completed'); INSERT INTO player_state(user_id,coins) VALUES ('${family}',17);`)
  const migration = await readFile(new URL('../scripts/migrate_child_profiles.sql', import.meta.url), 'utf8')
  await db.exec(migration); await db.exec(migration)
  const parent = (await db.query(`SELECT id FROM profiles WHERE user_id=$1 AND role='parent'`, [family])).rows[0].id
  assert.equal((await db.query('SELECT profile_id FROM user_progress')).rows[0].profile_id, parent)
  assert.equal((await db.query('SELECT coins FROM player_state')).rows[0].coins, 17)
  const children = (await db.query(`INSERT INTO profiles(user_id,name) VALUES ($1,'Zinc'),($1,'Rush') RETURNING id`, [family])).rows
  for (const [index, child] of children.entries()) {
    await db.query(`INSERT INTO user_progress(user_id,profile_id,lesson_id,last_position_seconds) VALUES ($1,$2,$3,$4) ON CONFLICT(profile_id,lesson_id) DO UPDATE SET last_position_seconds=excluded.last_position_seconds`, [family, child.id, lesson, index + 5])
    await db.query(`INSERT INTO player_state(user_id,profile_id,coins) VALUES ($1,$2,$3) ON CONFLICT(user_id,profile_id) DO UPDATE SET coins=excluded.coins`, [family,child.id,index+1])
  }
  assert.deepEqual((await db.query('SELECT coins FROM player_state ORDER BY coins')).rows.map(r=>r.coins), [1,2,17])
  assert.equal((await db.query('SELECT count(*)::int AS count FROM user_progress')).rows[0].count, 3)
  await assert.rejects(db.query(`INSERT INTO quiz_results(user_id,profile_id,lesson_id,correct_count,total_count) VALUES ($1,$2,$3,1,1)`, [other,children[0].id,lesson]))
  console.log('PASS: migration applies twice, preserves parent history and coins, separates children, rejects cross-family profile ownership')
} finally { await db.close() }
