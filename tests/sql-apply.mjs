// Applies the production schema history on PGlite, then the three 2026-11-14
// hand-off scripts twice each, and checks what Steel should see afterwards.
// Usage: node tests/sql-apply.mjs <pglite package.json> <setup_profiles.sql> <setup_learning_plans.sql>
// (the last two are the July scripts from the profiles-flashcards-wip branch:
//  git show profiles-flashcards-wip:scripts/setup_profiles.sql > /tmp/x.sql)
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const require = createRequire(process.argv[2] || import.meta.url)
const { PGlite } = require('@electric-sql/pglite')
const db = new PGlite()
const script = file => readFile(new URL(`../scripts/${file}`, import.meta.url), 'utf8')
try {
  await db.exec(`CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
    CREATE ROLE authenticated;`)
  await db.exec((await script('setup_db.sql')).split('-- SEED DATA:')[0])
  await db.exec((await script('migrate_visual_lessons.sql')).split('-- SEED:')[0])
  await db.exec(await readFile(process.argv[3], 'utf8'))
  await db.exec(await readFile(process.argv[4], 'utf8'))
  await db.exec(await script('migrate_child_profiles.sql'))
  const family = '00000000-0000-4000-8000-000000000001'
  await db.exec(`INSERT INTO auth.users VALUES ('${family}');
    INSERT INTO courses(slug,title,language_from,language_to,audience) VALUES ('spanish-kids-1','Spanish Quest (Kids)','English','Spanish','kids');
    INSERT INTO profiles(user_id,name,role) VALUES ('${family}','Parent','parent'),('${family}','Rush','child'),('${family}','Zinc','child');`)
  for (const file of ['seed_math_facts.sql', 'setup_wallet.sql', 'seed_kids_course_assignments.sql']) {
    const sql = await script(file)
    await db.exec(sql); await db.exec(sql)
  }
  const rows = async q => (await db.query(q)).rows
  assert.deepEqual(await rows(`SELECT l.lesson_number, l.title, l.lesson_type FROM lessons l JOIN courses c ON c.id=l.course_id WHERE c.slug='math-facts' ORDER BY 1`),
    [{ lesson_number: 1, title: 'Addition', lesson_type: 'math_practice' }, { lesson_number: 2, title: 'Subtraction', lesson_type: 'math_practice' }, { lesson_number: 3, title: 'Mixed', lesson_type: 'math_practice' }])
  assert.equal((await rows(`SELECT count(*)::int AS n FROM flashcard_decks WHERE slug='math-facts'`))[0].n, 1)
  assert.deepEqual(await rows(`SELECT p.name, c.slug FROM course_assignments a JOIN profiles p ON p.id=a.profile_id JOIN courses c ON c.id=a.course_id ORDER BY 1,2`),
    [{ name: 'Rush', slug: 'math-facts' }, { name: 'Rush', slug: 'spanish-kids-1' }, { name: 'Zinc', slug: 'math-facts' }, { name: 'Zinc', slug: 'spanish-kids-1' }])
  assert.equal((await rows(`SELECT count(*)::int AS n FROM pg_proc WHERE proname IN ('award_wallet','wallet_summary','wallet_today')`))[0].n, 3)
  await db.exec(`SELECT set_config('test.uid', '${family}', false)`)
  const [rush] = await rows(`SELECT id FROM profiles WHERE name='Rush'`)
  assert.equal((await db.query(`SELECT cents FROM award_wallet($1,'practice',NULL)`, [rush.id])).rows[0].cents, 10)
  console.log('PASS: schema history + the three hand-off scripts apply twice; 3 Math Facts lessons, deck, 2 assignments per child, wallet functions pay')
} finally { await db.close() }
