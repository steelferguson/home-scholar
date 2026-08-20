-- Seed the MLE Coding Refresh course (content served from the app at /content/...)

INSERT INTO courses (slug, title, description, language_from, language_to, lesson_count, sort_order, audience) VALUES
  ('mle-coding-refresh', 'MLE Coding Refresh', 'Get back up to speed for hands-on MLE coding interviews in ~3 hours: Python fluency, metrics and models from scratch, beam search, debugging under pressure, and working effectively with AI. Pairs with the hand-coding drills.', 'English', 'English', 9, 5, 'adult')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 1, 'Python That Flows Again', 'visual', '/content/mle-coding-refresh/lesson_01.json'
FROM courses WHERE slug = 'mle-coding-refresh'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 2, 'Metrics From Scratch', 'visual', '/content/mle-coding-refresh/lesson_02.json'
FROM courses WHERE slug = 'mle-coding-refresh'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 3, 'Splits, Folds, and Leakage', 'visual', '/content/mle-coding-refresh/lesson_03.json'
FROM courses WHERE slug = 'mle-coding-refresh'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 4, 'KNN and K-Means By Hand', 'visual', '/content/mle-coding-refresh/lesson_04.json'
FROM courses WHERE slug = 'mle-coding-refresh'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 5, 'Logistic Regression, Trained By You', 'visual', '/content/mle-coding-refresh/lesson_05.json'
FROM courses WHERE slug = 'mle-coding-refresh'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 6, 'Decoding: Greedy vs Beam Search', 'visual', '/content/mle-coding-refresh/lesson_06.json'
FROM courses WHERE slug = 'mle-coding-refresh'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 7, 'Debugging Under Pressure', 'visual', '/content/mle-coding-refresh/lesson_07.json'
FROM courses WHERE slug = 'mle-coding-refresh'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 8, 'Coding With AI, Effectively', 'visual', '/content/mle-coding-refresh/lesson_08.json'
FROM courses WHERE slug = 'mle-coding-refresh'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 9, 'The Practical Workflow: GBMs and sklearn', 'visual', '/content/mle-coding-refresh/lesson_09.json'
FROM courses WHERE slug = 'mle-coding-refresh'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
