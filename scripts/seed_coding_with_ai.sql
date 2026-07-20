-- Seed the Coding With AI course (content served from the app at /content/...)

INSERT INTO courses (slug, title, description, language_from, language_to, lesson_count, sort_order, audience) VALUES
  ('coding-with-ai', 'Coding With AI', 'A thinking framework for driving AI to build software well: own the problem/architecture/correctness, decompose into verifiable chunks, spec each as a contract, review in two passes, verify with real signal, iterate surgically. Ends with a worked take-home. ~2.5h.', 'English', 'English', 14, 9, 'adult')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 1, 'From Author to Director', 'visual', '/content/coding-with-ai/lesson_01.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 2, 'Read the Assignment Like an Engineer', 'visual', '/content/coding-with-ai/lesson_02.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 3, 'Decomposition: The Unit of Delegation', 'visual', '/content/coding-with-ai/lesson_03.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 4, 'Specifying a Task to AI', 'visual', '/content/coding-with-ai/lesson_04.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 5, 'Reviewing AI Output', 'visual', '/content/coding-with-ai/lesson_05.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 6, 'Verification: Trust Is Earned by Tests', 'visual', '/content/coding-with-ai/lesson_06.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 7, 'Iterating, Debugging, and Drift', 'visual', '/content/coding-with-ai/lesson_07.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 8, 'The Whole Framework, Worked', 'visual', '/content/coding-with-ai/lesson_08.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 9, 'The Live Multi-LLM Build', 'visual', '/content/coding-with-ai/lesson_09.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 10, 'The Multi-Inference Pattern Library', 'visual', '/content/coding-with-ai/lesson_10.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 11, 'Layering Complexity Deliberately', 'visual', '/content/coding-with-ai/lesson_11.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 12, 'Driving the Coding Agent Live', 'visual', '/content/coding-with-ai/lesson_12.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 13, 'A Worked Hour', 'visual', '/content/coding-with-ai/lesson_13.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 14, 'Tailoring the Build: Back-Office Document Products', 'visual', '/content/coding-with-ai/lesson_14.json'
FROM courses WHERE slug = 'coding-with-ai'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
