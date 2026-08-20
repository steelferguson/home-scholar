-- Seed the PyTorch Speed-Run course (content served from the app at /content/...)

INSERT INTO courses (slug, title, description, language_from, language_to, lesson_count, sort_order, audience) VALUES
  ('pytorch-speedrun', 'PyTorch Speed-Run', 'Lightning PyTorch refresher for MLE interviews: tensors, autograd, nn.Module, the training loop from memory, and the silent-bug catalog. ~90 minutes; pairs with the torch training-loop drill.', 'English', 'English', 5, 7, 'adult')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 1, 'Tensors: Shapes Without Hesitation', 'visual', '/content/pytorch-speedrun/lesson_01.json'
FROM courses WHERE slug = 'pytorch-speedrun'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 2, 'Autograd: Three Lines Around One Idea', 'visual', '/content/pytorch-speedrun/lesson_02.json'
FROM courses WHERE slug = 'pytorch-speedrun'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 3, 'nn.Module and Losses', 'visual', '/content/pytorch-speedrun/lesson_03.json'
FROM courses WHERE slug = 'pytorch-speedrun'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 4, 'The Training Loop From Memory', 'visual', '/content/pytorch-speedrun/lesson_04.json'
FROM courses WHERE slug = 'pytorch-speedrun'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 5, 'Gotchas and the Attention Capstone', 'visual', '/content/pytorch-speedrun/lesson_05.json'
FROM courses WHERE slug = 'pytorch-speedrun'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
