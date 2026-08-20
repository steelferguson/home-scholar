-- Seed the Pipeline Craft course (content served from the app at /content/...)

INSERT INTO courses (slug, title, description, language_from, language_to, lesson_count, sort_order, audience) VALUES
  ('pipeline-craft', 'Pipeline Craft', 'Review and improve Python data pipelines the way a production engineer does: the principles of a good pipeline, two messy examples fixed stage by stage (one records, one PyTorch), and the clarify-read-correctness-clean-scale review method for live interviews. ~2h.', 'English', 'English', 4, 12, 'adult')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 1, 'What Makes a Pipeline Good', 'visual', '/content/pipeline-craft/lesson_01.json'
FROM courses WHERE slug = 'pipeline-craft'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 2, 'Fixing a Messy Records Pipeline', 'visual', '/content/pipeline-craft/lesson_02.json'
FROM courses WHERE slug = 'pipeline-craft'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 3, 'Fixing a Messy PyTorch Training Pipeline', 'visual', '/content/pipeline-craft/lesson_03.json'
FROM courses WHERE slug = 'pipeline-craft'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 4, 'The Review Method', 'visual', '/content/pipeline-craft/lesson_04.json'
FROM courses WHERE slug = 'pipeline-craft'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
