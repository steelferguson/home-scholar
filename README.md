# Home Scholar

A web app for self-paced audio learning — language courses, music theory, and more.

## Features

- Email/password and Google OAuth authentication
- Course dashboard with progress tracking
- Audio lesson player with speed control and position saving
- Vocabulary/concepts viewer per lesson
- Resume from where you left off
- Mobile-friendly responsive design

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
Run `scripts/setup_db.sql` in the Supabase SQL Editor to create tables and seed courses.

### 5. Upload audio content
```bash
pip install supabase python-dotenv
python scripts/upload_audio.py
```

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
│   ├── hooks/
│   │   ├── useAuth.js       # Authentication hook
│   │   └── useProgress.js   # Progress tracking hook
│   └── pages/
│       ├── Login.jsx        # Login/signup
│       ├── Dashboard.jsx    # Course list with progress
│       ├── Course.jsx       # Lesson list
│       └── Lesson.jsx       # Audio player + vocab
├── scripts/
│   ├── setup_db.sql         # Database schema + seed data
│   ├── upload_audio.py      # Upload MP3s to Supabase Storage
│   └── upload_harmony.py    # Upload harmony course
└── PLAN.md                  # Full app design document
```

## License

MIT
