# Home Scholar

A web app for self-paced audio learning — language courses, music theory, and more.

## Status

_Last updated: 2026-07-10_

**Live** (database migrated + seeded on the production Supabase project):
- 4 audio courses — Czech 2, Spanish 1, English Connect 1, Harmony
- ML Interview — Visual Walkthroughs: 6 interactive lessons (tokenization,
  log loss, softmax, gradient descent, embeddings, attention)
- Spanish Quest (Kids): 3 quiz-game lessons (animals, colors, numbers) with
  coins, streaks, and the arcade platformer reward

**In progress:**
- Business Communication course: 11 visual lessons (pyramid principle, MECE,
  impromptu speaking, vocal delivery, SCQA presentations, business writing,
  meetings/feedback, Q&A, persuasion, data storytelling, remote presence)
  + 3 new widgets (before-after, word-hunt, practice-timer). Content is in
  the repo; run `scripts/seed_communication_course.sql` on production to
  register it
- No hosted deployment yet — the app runs locally via `npm run dev`; local
  copies must be updated to latest `main` to get the visual-lesson players

**Next up** (see CLAUDE.md for details):
- Pre-generated Spanish TTS audio for kids' questions (replacing browser TTS)
- Atomic coin-increment RPC + per-day earning caps
- Kid profiles under a parent account
- More ML lessons/widgets (backprop, eval metrics, transformer end-to-end)
- Host the app (e.g. Vercel auto-deploy from `main`)

## Features

- Email/password and Google OAuth authentication
- Course dashboard with progress tracking
- Audio lesson player with speed control and position saving
- **Visual lessons**: step-through interactive explainers with live widgets
  (tokenizer playground, log-loss explorer, gradient descent, attention heatmap, ...)
- **Kids quiz game**: Duolingo-style Spanish question rounds (audio prompts,
  picture matching) that earn coins, spendable on a 2D arcade platformer round
- Vocabulary/concepts viewer per lesson
- Resume from where you left off
- Mobile-friendly responsive design

See `VISUAL_LESSONS_PLAN.md` for the visual-lesson architecture and content format.

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS
- **Auth & Database**: Supabase (Postgres + Auth)
- **File Storage**: Supabase Storage (audio MP3s + vocabulary markdown)

## Setup

### 1. Clone and install
```bash
git clone https://github.com/steelferguson/home-scholar.git
cd home-scholar
npm install
```

### 2. Create a Supabase project
- Go to [supabase.com](https://supabase.com) and create a new project
- Copy your Project URL and anon key

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Set up the database
Run these in the Supabase SQL Editor, in order:
1. `scripts/setup_db.sql` — tables, RLS, seed courses
2. `scripts/migrate_visual_lessons.sql` — visual/quiz lesson support
3. `scripts/seed_visual_lessons.sql` — registers the visual/quiz lessons
4. `scripts/seed_communication_course.sql` — Business Communication course

Visual and quiz lesson content ships with the app (`public/content/`) — no
storage upload needed. (`scripts/upload_visual.py` exists for optionally
hosting content in Supabase Storage instead.)

### 5. Upload audio content
```bash
pip install supabase python-dotenv
python scripts/upload_audio.py    # audio lessons (MP3s + vocab)
```

To preview visual/quiz lesson content locally, run `npm run dev` and open
`http://localhost:5173/preview.html`.

### 6. Run the app
```bash
npm run dev
```

## Current Courses

| Course | Lessons | Duration |
|--------|---------|----------|
| Czech — Unit 2 | 30 | ~12.5 hours |
| Spanish — Unit 1 | 30 | ~10 hours |
| English Connect 1 | 14 | ~5.3 hours |
| Harmony & Music Theory | 40 | ~20 hours |
| **Total** | **114** | **~48 hours** |

## Project Structure

```
home-scholar/
├── src/
│   ├── App.jsx              # Router and auth
│   ├── supabaseClient.js    # Supabase connection
│   ├── preview.jsx          # Dev-only local content preview (preview.html)
│   ├── hooks/
│   │   ├── useAuth.js       # Authentication hook
│   │   ├── useProgress.js   # Progress tracking hook
│   │   └── usePlayerState.js # Kids game coins + streak
│   ├── components/
│   │   ├── visual/          # Step player, step renderer, widget registry
│   │   │   └── widgets/     # Interactive ML concept widgets
│   │   └── game/            # Kids quiz round + arcade platformer
│   └── pages/
│       ├── Login.jsx        # Login/signup
│       ├── Dashboard.jsx    # Course list with progress
│       ├── Course.jsx       # Lesson list
│       └── Lesson.jsx       # Player switch: audio / visual / quiz game
├── content/                 # Visual + quiz lesson JSONs (uploaded to storage)
├── scripts/
│   ├── setup_db.sql         # Database schema + seed data
│   ├── migrate_visual_lessons.sql # Visual lessons migration
│   ├── upload_audio.py      # Upload MP3s to Supabase Storage
│   ├── upload_harmony.py    # Upload harmony course
│   └── upload_visual.py     # Upload visual/quiz lesson content
├── PLAN.md                  # Original app design document
└── VISUAL_LESSONS_PLAN.md   # Visual lessons design document
```

## License

MIT
