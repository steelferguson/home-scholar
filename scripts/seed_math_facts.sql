-- Math Facts course: three keypad practice sets (addition, subtraction, mixed, 0-9).
-- Run in the Supabase SQL Editor. Safe to re-run.
-- 1. New lesson type.
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_lesson_type_check
  CHECK (lesson_type IN ('audio', 'visual', 'quiz_game', 'math_practice'));

-- 2. Course row (kids audience so it is hidden from children until a parent ticks it).
INSERT INTO public.courses (slug, title, description, audience, sort_order)
VALUES ('math-facts', 'Math Facts', 'Addition and subtraction facts, 20 quick questions at a time. Type the answer on the keypad.', 'kids', 5)
ON CONFLICT (slug) DO NOTHING;

-- 3. Three practice sets. Content JSON ships with the app at /content/math-facts/.
INSERT INTO public.lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT c.id, v.n, v.title, 'math_practice', v.url
FROM public.courses c
JOIN (VALUES
  (1, 'Addition', '/content/math-facts/lesson_01.json'),
  (2, 'Subtraction', '/content/math-facts/lesson_02.json'),
  (3, 'Mixed', '/content/math-facts/lesson_03.json')
) AS v(n, title, url) ON TRUE
WHERE c.slug = 'math-facts'
ON CONFLICT (course_id, lesson_number) DO NOTHING;

-- 4. Deck that holds per-child miss counts in flashcard_progress (RLS from the July schema).
INSERT INTO public.flashcard_decks (slug, title, description, category, card_count, sort_order)
VALUES ('math-facts', 'Math Facts (0-9)', 'Addition 0+0..9+9 and matching subtraction', 'math', 200, 0)
ON CONFLICT (slug) DO NOTHING;

-- 5. Give every child the course (same shape as seed_kids_course_assignments.sql).
INSERT INTO public.course_assignments (profile_id, course_id)
SELECT p.id, c.id FROM public.profiles p JOIN public.courses c ON c.slug = 'math-facts'
WHERE p.role = 'child'
ON CONFLICT (profile_id, course_id) DO NOTHING;

-- Check.
SELECT l.lesson_number, l.title, l.lesson_type, l.content_url
FROM public.lessons l JOIN public.courses c ON c.id = l.course_id
WHERE c.slug = 'math-facts' ORDER BY l.lesson_number;
