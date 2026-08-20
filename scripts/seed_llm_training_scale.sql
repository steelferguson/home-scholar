-- Seed the LLM Training at Scale course (content served from the app at /content/...)

INSERT INTO courses (slug, title, description, language_from, language_to, lesson_count, sort_order, audience) VALUES
  ('llm-training-scale', 'LLM Training at Scale', 'The engineering half of an LLM role: tokenization (BPE, byte-level), embeddings, transformer language modeling and fine-tuning (LoRA), the memory accounting that forces distributed training, data/tensor/pipeline parallelism, ZeRO/FSDP, GPU efficiency (MFU, FlashAttention), tied to safety ML at scale. ~3h.', 'English', 'English', 8, 10, 'adult')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 1, 'Tokenization, Deeply', 'visual', '/content/llm-training-scale/lesson_01.json'
FROM courses WHERE slug = 'llm-training-scale'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 2, 'Embeddings', 'visual', '/content/llm-training-scale/lesson_02.json'
FROM courses WHERE slug = 'llm-training-scale'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 3, 'Language Modeling and the Transformer', 'visual', '/content/llm-training-scale/lesson_03.json'
FROM courses WHERE slug = 'llm-training-scale'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 4, 'The Memory Wall: Why One GPU Is Not Enough', 'visual', '/content/llm-training-scale/lesson_04.json'
FROM courses WHERE slug = 'llm-training-scale'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 5, 'Parallelism Strategies', 'visual', '/content/llm-training-scale/lesson_05.json'
FROM courses WHERE slug = 'llm-training-scale'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 6, 'ZeRO, FSDP, and the Frameworks', 'visual', '/content/llm-training-scale/lesson_06.json'
FROM courses WHERE slug = 'llm-training-scale'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 7, 'Efficiency: Making It Fast, Not Just Fit', 'visual', '/content/llm-training-scale/lesson_07.json'
FROM courses WHERE slug = 'llm-training-scale'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 8, 'Tying It to Safety ML at Reddit Scale', 'visual', '/content/llm-training-scale/lesson_08.json'
FROM courses WHERE slug = 'llm-training-scale'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
