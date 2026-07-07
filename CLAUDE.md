# Home Scholar

Self-paced learning web app for the Ferguson family. Three lesson types:
audio (Pimsleur-style language/music courses), visual (interactive ML/AI
explainers for adult interview prep), and quiz_game (Spanish for kids 6–8:
question rounds earn coins, coins buy rounds of a 2D arcade platformer).

## Stack

- React 19 + Vite + Tailwind 4 (`@tailwindcss/typography` via `@plugin` in index.css)
- Supabase: auth, Postgres, storage. Client env vars: `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY` in `.env` (never commit it)
- KaTeX (math), kaplay (arcade engine), canvas-confetti — all lazy-loaded;
  keep them out of the main chunk

## Commands

- `npm run dev` — app at :5173 (needs .env)
- `npm run dev` + open `/preview.html` — renders local content JSONs through
  the real lesson components WITHOUT Supabase; use this to test content and
  lesson components
- `npm run build && npm run lint` — must both pass before pushing

## Architecture

- `src/pages/Lesson.jsx` switches on `lessons.lesson_type`:
  audio (inline) | `visual` → `components/visual/VisualLessonPlayer` |
  `quiz_game` → `components/game/QuizGame` (full-screen kid theme)
- Visual lessons = JSON step arrays (text | image | math | quiz | widget |
  video). Widgets are React components registered by id in
  `components/visual/widgets/index.js`; content JSON never contains code
- Content JSONs live in `public/content/<course-slug>/lesson_NN.json`,
  served by the app itself at `/content/...` — publishing content is a git
  push plus a lessons-table row (see below), NOT a storage upload
- Kids game: `QuestionRound` (tap-picture, listen-choose, match-pairs,
  word-order; audio via browser Spanish TTS, per-question `audio_url` field
  reserved for pre-generated MP3s) → coins/streaks in `player_state` +
  `quiz_results` (hooks/usePlayerState.js) → `ArcadeGame` (kaplay platformer,
  collectibles carry the lesson's Spanish words)
- Progress: `user_progress.last_position_seconds` stores audio seconds OR
  visual step index depending on lesson_type (known schema pun)

## Database setup order (Supabase SQL editor)

1. `scripts/setup_db.sql` 2. `scripts/migrate_visual_lessons.sql`
3. `scripts/seed_visual_lessons.sql`
All three have been run on the production project (July 2026).

## Adding a lesson

1. Author `public/content/<course>/lesson_NN.json` (copy an existing one;
   `type` field = `visual` or `quiz_game`)
2. Check it at `/preview.html`
3. Add a row via SQL like `scripts/seed_visual_lessons.sql` (content_url is
   the relative `/content/...` path)
4. New widget? Add component under `components/visual/widgets/` + register in
   `index.js`. Unknown widget/step/question types must degrade gracefully —
   never crash or soft-lock on newer content

## Conventions & gotchas

- Player components are keyed by lesson id in Lesson.jsx — state must not
  leak across lessons; StepRenderer is keyed by step index
- Never let step navigation write progress on a completed lesson (it would
  un-complete it); replays of kid quiz rounds are practice — coins bank once
- `usePlayerState` re-reads the DB row before every coin write (races);
  a proper atomic-increment RPC is a known TODO
- Kids UI: audio-first, big tap targets, no reading required, no punishment
  for wrong answers; generic platformer art only (no Nintendo IP)

## Known follow-ups (not yet built)

- Pre-generated Spanish TTS MP3s wired into question `audio_url`
- Atomic coin increment RPC; per-day earning caps
- Kid profiles under a parent account (Netflix-style picker)
- More ML lessons/widgets (backprop, evaluation metrics, transformers e2e)
