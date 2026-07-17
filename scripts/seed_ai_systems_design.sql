-- Seed the AI Systems Design course (content served from the app at /content/...)

INSERT INTO courses (slug, title, description, language_from, language_to, lesson_count, sort_order, audience) VALUES
  ('ai-systems-design', 'AI Systems Design', 'System design for AI agents and AI systems: the interview framework, LLM serving and cost, RAG, agent loops and tools, memory, evals/guardrails, and a worked contact-center agent capstone. ~2.5h.', 'English', 'English', 11, 8, 'adult')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 1, 'The AI System Design Interview', 'visual', '/content/ai-systems-design/lesson_01.json'
FROM courses WHERE slug = 'ai-systems-design'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 2, 'The LLM Serving Layer', 'visual', '/content/ai-systems-design/lesson_02.json'
FROM courses WHERE slug = 'ai-systems-design'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 3, 'RAG: The Retrieval Half', 'visual', '/content/ai-systems-design/lesson_03.json'
FROM courses WHERE slug = 'ai-systems-design'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 4, 'Agent Architecture: Giving the Model Hands', 'visual', '/content/ai-systems-design/lesson_04.json'
FROM courses WHERE slug = 'ai-systems-design'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 5, 'Memory and State', 'visual', '/content/ai-systems-design/lesson_05.json'
FROM courses WHERE slug = 'ai-systems-design'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 6, 'Evals, Guardrails, and Shipping Safely', 'visual', '/content/ai-systems-design/lesson_06.json'
FROM courses WHERE slug = 'ai-systems-design'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 7, 'Capstone: Design a Contact-Center AI Agent', 'visual', '/content/ai-systems-design/lesson_07.json'
FROM courses WHERE slug = 'ai-systems-design'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 8, 'Back-Office Agents: Automating the Work Itself', 'visual', '/content/ai-systems-design/lesson_08.json'
FROM courses WHERE slug = 'ai-systems-design'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 9, 'Architecture Gallery: The Request Path', 'visual', '/content/ai-systems-design/lesson_09.json'
FROM courses WHERE slug = 'ai-systems-design'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 10, 'Architecture Gallery: Operations and Scale', 'visual', '/content/ai-systems-design/lesson_10.json'
FROM courses WHERE slug = 'ai-systems-design'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 11, 'Classical ML System Design: The Recommender', 'visual', '/content/ai-systems-design/lesson_11.json'
FROM courses WHERE slug = 'ai-systems-design'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
