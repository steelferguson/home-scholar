-- Home Scholar — Visual Lessons Migration
-- Run this in Supabase SQL Editor AFTER setup_db.sql.
-- Also create a public storage bucket named `visual` (Dashboard > Storage)
-- for lesson content JSON files.

-- ==========================================
-- LESSON TYPES
-- ==========================================

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS lesson_type text NOT NULL DEFAULT 'audio'
  CHECK (lesson_type IN ('audio', 'visual', 'quiz_game'));

-- Content JSON in the `visual` bucket (for visual + quiz_game lessons)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content_url text;

-- Audience drives theming (kid mode) and dashboard grouping
ALTER TABLE courses ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'adult'
  CHECK (audience IN ('adult', 'kids'));

-- ==========================================
-- QUIZ RESULTS + PLAYER STATE (kids game loop)
-- ==========================================

CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  correct_count int NOT NULL,
  total_count int NOT NULL,
  coins_earned int NOT NULL DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_state (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  coins int NOT NULL DEFAULT 0,
  streak_days int NOT NULL DEFAULT 0,
  last_played_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_results_select_own" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quiz_results_insert_own" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "player_state_select_own" ON player_state
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "player_state_insert_own" ON player_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "player_state_update_own" ON player_state
  FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- SEED: NEW COURSES
-- ==========================================

INSERT INTO courses (slug, title, description, language_from, language_to, lesson_count, sort_order, audience) VALUES
  ('ml-interview-visual', 'ML Interview — Visual Walkthroughs', 'Interactive visual explanations of core ML concepts: tokenization, log & loss functions, softmax, gradient descent, embeddings, and attention. Companion to the audio interview prep.', 'English', 'English', 6, 4, 'adult'),
  ('spanish-kids-1', 'Spanish Quest (Kids)', 'Learn Spanish words by playing! Answer picture questions to earn coins, then spend them on arcade rounds. For ages 6-8.', 'English', 'Spanish', 3, 5, 'kids')
ON CONFLICT (slug) DO NOTHING;
