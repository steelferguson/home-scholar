-- Seed visual/quiz lessons (content served from the app at /content/...)

INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 1, 'How Tokenization Works', 'visual', '/content/ml-interview-visual/lesson_01.json'
FROM courses WHERE slug = 'ml-interview-visual'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 2, 'Why Log? Logarithms & Log Loss', 'visual', '/content/ml-interview-visual/lesson_02.json'
FROM courses WHERE slug = 'ml-interview-visual'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 3, 'Softmax & Temperature', 'visual', '/content/ml-interview-visual/lesson_03.json'
FROM courses WHERE slug = 'ml-interview-visual'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 4, 'Gradient Descent, Visually', 'visual', '/content/ml-interview-visual/lesson_04.json'
FROM courses WHERE slug = 'ml-interview-visual'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 5, 'Embeddings & Similarity', 'visual', '/content/ml-interview-visual/lesson_05.json'
FROM courses WHERE slug = 'ml-interview-visual'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 6, 'Attention, Visually', 'visual', '/content/ml-interview-visual/lesson_06.json'
FROM courses WHERE slug = 'ml-interview-visual'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 1, 'Los Animales', 'quiz_game', '/content/spanish-kids-1/lesson_01.json'
FROM courses WHERE slug = 'spanish-kids-1'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 2, 'Los Colores', 'quiz_game', '/content/spanish-kids-1/lesson_02.json'
FROM courses WHERE slug = 'spanish-kids-1'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 3, 'Los Números', 'quiz_game', '/content/spanish-kids-1/lesson_03.json'
FROM courses WHERE slug = 'spanish-kids-1'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
