-- Business Communication course (visual lessons, adult audience).
-- Run in Supabase SQL Editor AFTER setup_db.sql + migrate_visual_lessons.sql.
-- Content JSONs ship with the app under public/content/business-communication/.

INSERT INTO courses (slug, title, description, language_from, language_to, lesson_count, sort_order, audience) VALUES
  ('business-communication', 'Business Communication — Speak & Write with Structure',
   'Structured thinking and communication for work: the Pyramid Principle, MECE, impromptu-speaking frameworks, vocal delivery (pace, pauses, fillers), SCQA presentations, business writing, meetings & feedback, and Q&A under pressure. Interactive drills throughout.',
   'English', 'English', 8, 6, 'adult')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 1, 'Answer First: The Pyramid Principle', 'visual', '/content/business-communication/lesson_01.json'
FROM courses WHERE slug = 'business-communication'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 2, 'Structured Thinking: MECE, Grouping & Order', 'visual', '/content/business-communication/lesson_02.json'
FROM courses WHERE slug = 'business-communication'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 3, 'Think on Your Feet: Impromptu Speaking Frameworks', 'visual', '/content/business-communication/lesson_03.json'
FROM courses WHERE slug = 'business-communication'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 4, 'Vocal Delivery: Pace, Pauses & Filler Words', 'visual', '/content/business-communication/lesson_04.json'
FROM courses WHERE slug = 'business-communication'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 5, 'Presentations That Land: SCQA & Storylining', 'visual', '/content/business-communication/lesson_05.json'
FROM courses WHERE slug = 'business-communication'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 6, 'Writing That Gets Read: Email, Memos & Chat', 'visual', '/content/business-communication/lesson_06.json'
FROM courses WHERE slug = 'business-communication'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 7, 'Meetings, Feedback & Disagreeing Well', 'visual', '/content/business-communication/lesson_07.json'
FROM courses WHERE slug = 'business-communication'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
INSERT INTO lessons (course_id, lesson_number, title, lesson_type, content_url)
SELECT id, 8, 'Listening & Q&A Under Pressure', 'visual', '/content/business-communication/lesson_08.json'
FROM courses WHERE slug = 'business-communication'
ON CONFLICT (course_id, lesson_number) DO UPDATE
  SET title = EXCLUDED.title, lesson_type = EXCLUDED.lesson_type, content_url = EXCLUDED.content_url;
