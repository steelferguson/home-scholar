# Home Scholar — App Plan

## Overview
A web app for accessing Pimsleur-style language learning audio lessons. Login, track progress, stream/download lessons.

## Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **Database**: Supabase Postgres
- **File Storage**: Supabase Storage (audio MP3s + vocab MDs)
- **Audio Player**: HTML5 `<audio>` element with progress tracking

## Data Model

### courses
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| slug | text (unique) | URL-friendly name (e.g., "czech-2", "spanish-1") |
| title | text | Display name (e.g., "Czech — Unit 2") |
| description | text | Short description |
| language_from | text | Instruction language (e.g., "English") |
| language_to | text | Target language (e.g., "Czech") |
| image_url | text | Course thumbnail (nullable) |
| lesson_count | int | Number of lessons |
| sort_order | int | Display ordering |
| created_at | timestamptz | Auto |

### lessons
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| course_id | uuid (FK → courses) | Which course |
| lesson_number | int | Ordering within course |
| title | text | Lesson title |
| duration_minutes | decimal | Length in minutes |
| audio_url | text | Supabase storage path |
| vocab_url | text | Supabase storage path (nullable) |
| created_at | timestamptz | Auto |

### user_progress
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK → auth.users) | Supabase auth user |
| lesson_id | uuid (FK → lessons) | Which lesson |
| status | text | "not_started", "in_progress", "completed" |
| last_position_seconds | int | Playback position for resume |
| completed_at | timestamptz | When marked complete (nullable) |
| updated_at | timestamptz | Auto |
| UNIQUE(user_id, lesson_id) | | One row per user per lesson |

## Row Level Security (RLS)
- courses: public read
- lessons: public read
- user_progress: users can only read/write their own rows

## Supabase Storage Buckets
- `audio` — MP3 lesson files (public read)
- `vocab` — Vocab markdown files (public read)

## Pages / Routes

### 1. `/login`
- Email/password signup and login
- Google OAuth button
- Redirect to dashboard on success

### 2. `/` (Dashboard)
- Grid of course cards with progress bars
- "Continue" button jumps to next incomplete lesson
- Shows overall progress per course (e.g., "12/30 lessons")

### 3. `/course/:slug`
- Course title and description
- Ordered list of lessons with status icons:
  - ○ not started
  - ◐ in progress
  - ● completed
- Download full bundle button
- Click lesson → lesson player

### 4. `/course/:slug/lesson/:number`
- Audio player (play/pause, scrubber, speed control)
- Auto-saves playback position every 10 seconds
- Vocabulary section below player (rendered from markdown)
- "Mark Complete" button
- Next/Previous lesson navigation
- Resume from last position on return

## File Structure
```
home-scholar/
├── .env
├── PLAN.md
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── supabaseClient.js
│   ├── components/
│   │   ├── AudioPlayer.jsx
│   │   ├── CourseCard.jsx
│   │   ├── LessonList.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── VocabViewer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Course.jsx
│   │   └── Lesson.jsx
│   └── hooks/
│       ├── useAuth.js
│       └── useProgress.js
├── scripts/
│   ├── setup_db.sql        # Create tables + RLS policies
│   └── upload_audio.py     # Upload MP3s + vocab to Supabase storage
└── public/
    └── (static assets)
```

## Initial Courses (3 bundles)
1. **Czech — Unit 2** (slug: "czech-2") — Lessons 31-60, ~12.5 hours
2. **Spanish — Unit 1** (slug: "spanish-1") — Lessons 1-30, ~10 hours
3. **English Connect 1** (slug: "english-connect-1") — Lessons 1-14, ~5.3 hours

## Future Extensibility
- Course marketplace (other creators upload courses)
- Spaced repetition quiz mode using vocab lists
- Streaks and gamification
- Mobile app (React Native or Capacitor wrapper)
- Social features (study groups, leaderboards)
- Admin panel for managing courses
- Payment/subscription for premium courses
- Analytics dashboard (lesson completion rates, time spent)

## Build Order
1. Supabase setup (tables, RLS, storage buckets)
2. Upload audio files to Supabase storage
3. Scaffold React app with Vite + Tailwind
4. Auth (login page, protected routes)
5. Dashboard (course cards, progress)
6. Course page (lesson list)
7. Lesson player (audio, vocab, progress saving)
8. Polish and test
