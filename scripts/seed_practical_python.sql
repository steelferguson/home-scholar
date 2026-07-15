-- Seed the Practical Python Speed-Run course (content served from the app at /content/...)

INSERT INTO courses (slug, title, description, language_from, language_to, lesson_count, sort_order, audience) VALUES
  ('practical-python', 'Practical Python Speed-Run', 'Rebuild raw Python syntax recall for timed practical coding screens (CodeSignal-style): core syntax, collections, parsing, classes, stdlib, and the 90-minute multi-level game plan. Pairs with the ICA simulation drill.', 'English', 'English', 6, 6, 'adult')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 1, 'Core Syntax, Fast', 'visual', '/content/practical-python/lesson_01.json'
FROM courses WHERE slug = 'practical-python'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 2, 'Collections Mastery', 'visual', '/content/practical-python/lesson_02.json'
FROM courses WHERE slug = 'practical-python'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 3, 'Strings and Parsing', 'visual', '/content/practical-python/lesson_03.json'
FROM courses WHERE slug = 'practical-python'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 4, 'Classes at Speed', 'visual', '/content/practical-python/lesson_04.json'
FROM courses WHERE slug = 'practical-python'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 5, 'The Standard Library Grab-Bag', 'visual', '/content/practical-python/lesson_05.json'
FROM courses WHERE slug = 'practical-python'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 6, 'The 90-Minute Game Plan', 'visual', '/content/practical-python/lesson_06.json'
FROM courses WHERE slug = 'practical-python'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
