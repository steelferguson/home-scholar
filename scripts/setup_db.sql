-- Home Scholar — Database Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ==========================================
-- TABLES
-- ==========================================

CREATE TABLE courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  language_from text NOT NULL,
  language_to text NOT NULL,
  image_url text,
  lesson_count int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  lesson_number int NOT NULL,
  title text NOT NULL,
  duration_minutes decimal,
  audio_url text,
  vocab_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, lesson_number)
);

CREATE TABLE user_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  last_position_seconds int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Index for fast progress lookups
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_lessons_course ON lessons(course_id, lesson_number);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Courses: anyone can read
CREATE POLICY "courses_public_read" ON courses
  FOR SELECT USING (true);

-- Lessons: anyone can read
CREATE POLICY "lessons_public_read" ON lessons
  FOR SELECT USING (true);

-- User progress: users can only access their own
CREATE POLICY "progress_select_own" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "progress_insert_own" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_update_own" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- SEED DATA: COURSES
-- ==========================================

INSERT INTO courses (slug, title, description, language_from, language_to, lesson_count, sort_order) VALUES
  ('czech-2', 'Czech — Unit 2', 'Lessons 31-60. From capable tourist to comfortable resident. Covers restaurant, transport, shopping, past tense, plans, hotel, work, hobbies, culture, and more.', 'English', 'Czech', 30, 1),
  ('spanish-1', 'Spanish — Unit 1', 'Lessons 1-30. Complete beginner course. Covers greetings, food, directions, transport, shopping, family, health, culture, and daily life in Mexico.', 'English', 'Spanish', 30, 2),
  ('english-connect-1', 'English Connect 1', 'Based on the English Connect curriculum. 14 lessons for Spanish speakers learning English. Covers greetings, personal info, family, daily life, jobs, food, health, and more.', 'Spanish', 'English', 14, 3);
