-- Apply in Supabase SQL Editor before deploying the profile release.
-- Existing unassigned history belongs to the parent; children start fresh.
BEGIN;
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'child' CHECK (role IN ('parent','child')),
  avatar_color text NOT NULL DEFAULT '#555555',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
-- The password prompt is a family UI gate, not separate child authentication.
-- Composite foreign keys also prevent a row claiming another family's profile.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_owner_id ON public.profiles(user_id, id);
INSERT INTO public.profiles(user_id, name, role)
SELECT u.id, 'Parent', 'parent' FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id AND p.role = 'parent');

ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.player_state ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.quiz_results ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id);

UPDATE public.user_progress r SET profile_id = (
 SELECT p.id FROM public.profiles p WHERE p.user_id = r.user_id AND p.role = 'parent' ORDER BY p.created_at, p.id LIMIT 1
) WHERE profile_id IS NULL;
UPDATE public.player_state r SET profile_id = (
 SELECT p.id FROM public.profiles p WHERE p.user_id = r.user_id AND p.role = 'parent' ORDER BY p.created_at, p.id LIMIT 1
) WHERE profile_id IS NULL;
UPDATE public.quiz_results r SET profile_id = (
 SELECT p.id FROM public.profiles p WHERE p.user_id = r.user_id AND p.role = 'parent' ORDER BY p.created_at, p.id LIMIT 1
) WHERE profile_id IS NULL;

ALTER TABLE public.user_progress ALTER COLUMN profile_id SET NOT NULL;
ALTER TABLE public.player_state ALTER COLUMN profile_id SET NOT NULL;
ALTER TABLE public.quiz_results ALTER COLUMN profile_id SET NOT NULL;
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_lesson_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS user_progress_profile_lesson ON public.user_progress(profile_id, lesson_id);
ALTER TABLE public.player_state DROP CONSTRAINT IF EXISTS player_state_pkey;
ALTER TABLE public.player_state ADD PRIMARY KEY (user_id, profile_id);

ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS progress_profile_owner;
ALTER TABLE public.user_progress ADD CONSTRAINT progress_profile_owner FOREIGN KEY (user_id,profile_id) REFERENCES public.profiles(user_id,id) ON DELETE CASCADE;
ALTER TABLE public.player_state DROP CONSTRAINT IF EXISTS player_profile_owner;
ALTER TABLE public.player_state ADD CONSTRAINT player_profile_owner FOREIGN KEY (user_id,profile_id) REFERENCES public.profiles(user_id,id) ON DELETE CASCADE;
ALTER TABLE public.quiz_results DROP CONSTRAINT IF EXISTS quiz_profile_owner;
ALTER TABLE public.quiz_results ADD CONSTRAINT quiz_profile_owner FOREIGN KEY (user_id,profile_id) REFERENCES public.profiles(user_id,id) ON DELETE CASCADE;
COMMIT;
