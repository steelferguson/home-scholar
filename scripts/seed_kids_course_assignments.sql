-- Give every child profile Spanish Quest (Kids). Safe to re-run: existing rows are skipped.
-- Run in the Supabase SQL Editor after the course-assignments release is live.
-- Parents keep seeing every course; children see only rows in course_assignments.
INSERT INTO public.course_assignments (profile_id, course_id)
SELECT p.id, c.id
FROM public.profiles p
JOIN public.courses c ON c.slug = 'spanish-kids-1'
WHERE p.role = 'child'
ON CONFLICT (profile_id, course_id) DO NOTHING;

-- Check: one row per child.
SELECT p.name, c.title, a.assigned_at
FROM public.course_assignments a
JOIN public.profiles p ON p.id = a.profile_id
JOIN public.courses c ON c.id = a.course_id
ORDER BY p.name, c.title;
