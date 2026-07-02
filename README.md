# Home Scholar

A web app for self-paced audio learning — language courses, music theory, and more.

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
Run `scripts/setup_db.sql` in the Supabase SQL Editor to create tables and seed courses,
then `scripts/migrate_visual_lessons.sql` for visual/quiz lesson support
(also create a public `visual` storage bucket).

### 5. Upload content
```bash
pip install supabase python-dotenv
python scripts/upload_audio.py    # audio lessons (MP3s + vocab)
python scripts/upload_visual.py   # visual + quiz-game lessons (content/*.json)
```

To preview visual/quiz lesson content locally without uploading, run
`npm run dev` and open `http://localhost:5173/preview.html`.

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
