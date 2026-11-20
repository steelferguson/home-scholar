// Offline Postgres integration test for scripts/daily_plan.sql.
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
    CREATE ROLE authenticated; CREATE ROLE anon;`)
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
  await db.exec("UPDATE courses SET slug='spanish-kids-1'; UPDATE lessons SET lesson_type='quiz_game';")
  await db.exec("ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;")
  await db.exec(`INSERT INTO courses(slug,title,language_from,language_to) VALUES ('math-facts','Math','en','en');
    INSERT INTO lessons(course_id,lesson_number,title,lesson_type) SELECT id,n,'Practice','math_practice' FROM courses CROSS JOIN generate_series(1,3) n WHERE slug='math-facts';`)
  const sql = await read('daily_plan.sql')
  await db.exec(sql); await db.exec(sql)
  const plan = async () => (await db.query('SELECT * FROM daily_plan($1)', [rush.id])).rows
  const finish = async step => (await db.query('SELECT * FROM finish_daily_step($1,$2,$3,$4)', [rush.id,step.school_day,step.slot,step.lesson_id])).rows[0]
  let steps = await plan()
  assert.deepEqual(steps.map(s=>s.lesson_number), [1,2,3,3,1])
  await assert.rejects(finish(steps[4]), /next step/)
  for (const step of steps) assert.equal((await finish(step)).cents,10)
  await finish(steps[3])
  assert.equal((await db.query('SELECT sum(cents)::int AS total FROM wallet_entries')).rows[0].total,50)
  assert.ok((await plan()).every(s=>s.completed))
  await db.exec("UPDATE child_daily_steps SET school_day=school_day-1; UPDATE wallet_entries SET created_at=created_at-interval '1 day'")
  steps = await plan()
  assert.equal(steps[4].lesson_number,2)
  await db.query("INSERT INTO user_progress(user_id,profile_id,lesson_id,status) VALUES ($1,$2,$3,'completed')", [family,rush.id,steps[4].lesson_id])
  for (const step of steps) assert.equal((await finish(step)).cents,step.slot===5?5:10)
  assert.equal((await finish(steps[4])).earned_today,45)
  await as(other)
  await assert.rejects(plan(), /unavailable/)
  await as(family)
  await assert.rejects(db.query('SELECT * FROM daily_plan($1)',[parent.id]), /unavailable/)
  await db.exec(wallet) // Rerunning wallet setup must preserve the new permissions.
  assert.equal((await db.query("SELECT has_function_privilege('authenticated','award_wallet(uuid,text,uuid)','execute') AS allowed")).rows[0].allowed,false)
  const [zinc] = (await db.query("INSERT INTO profiles(user_id,name) VALUES ($1,'Zinc') RETURNING id",[family])).rows
  const freeSQL = await read('free_choice.sql')
  await db.exec(freeSQL); await db.exec(freeSQL)
  const free = async (lessonId, attempt=crypto.randomUUID(), profile=zinc.id) =>
    (await db.query('SELECT finish_free_choice($1,$2,$3) AS cents',[profile,lessonId,attempt])).rows[0].cents
  const request = crypto.randomUUID()
  assert.equal(await free(lesson,request),10)
  assert.equal(await free(lesson,request),10)
  assert.equal(await free(lesson),5)
  const mathId = steps[0].lesson_id
  for (const expected of [10,10,10,5,0]) assert.equal(await free(mathId),expected)
  assert.equal(await free(lesson2),0)
  await db.query("UPDATE wallet_entries SET created_at=created_at-interval '1 day' WHERE profile_id=$1",[zinc.id])
  assert.equal(await free(lesson2),5,'a first completion beyond the cap still counts')
  await assert.rejects(free(lesson,crypto.randomUUID(),rush.id), /unavailable/)
  await as(other)
  await assert.rejects(free(lesson),/unavailable/)
  console.log('PASS: ordered steps, persistence, ownership, replay, daily reset, and idempotent wallet awards')
} finally { await db.close() }
