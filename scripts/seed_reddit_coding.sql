-- Seed the Reddit Coding Interview course (content served from the app at /content/...)

INSERT INTO courses (slug, title, description, language_from, language_to, lesson_count, sort_order, audience) VALUES
  ('reddit-coding', 'Reddit Coding Interview', 'Reddit-style 60-min coding interview prep: convert messy requirements into clean models with correct edge-case handling. One lesson per area (state machines, composition, event replay, trees, throttling), each paired with a hands-on drill (r01-r05). ~1.5h.', 'English', 'English', 6, 11, 'adult')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 1, 'The Format and the Habits', 'visual', '/content/reddit-coding/lesson_01.json'
FROM courses WHERE slug = 'reddit-coding'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 2, 'State Machines and Invariants', 'visual', '/content/reddit-coding/lesson_02.json'
FROM courses WHERE slug = 'reddit-coding'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 3, 'Composition', 'visual', '/content/reddit-coding/lesson_03.json'
FROM courses WHERE slug = 'reddit-coding'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 4, 'Event and Log Replay', 'visual', '/content/reddit-coding/lesson_04.json'
FROM courses WHERE slug = 'reddit-coding'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 5, 'Trees and Comment Threads', 'visual', '/content/reddit-coding/lesson_05.json'
FROM courses WHERE slug = 'reddit-coding'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 6, 'Time-Based Throttling', 'visual', '/content/reddit-coding/lesson_06.json'
FROM courses WHERE slug = 'reddit-coding'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
