BEGIN;
-- This allowlist belongs to existing profiles. Changing a profile's display
-- name or creating a namesake must never change its course access.
CREATE TABLE IF NOT EXISTS public.free_choice_profiles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.free_choice_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.free_choice_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.free_choice_profiles TO authenticated;
DROP POLICY IF EXISTS read_family_choice ON public.free_choice_profiles;
CREATE POLICY read_family_choice ON public.free_choice_profiles FOR SELECT TO authenticated
USING (EXISTS (SELECT FROM public.profiles p WHERE p.id=profile_id AND p.user_id=auth.uid()));

DO $$
DECLARE target uuid;
BEGIN
  IF NOT EXISTS (SELECT FROM public.free_choice_profiles) THEN
    SELECT p.id INTO STRICT target FROM public.profiles p
    WHERE lower(trim(p.name))='zinc' AND p.role='child' AND EXISTS (
      SELECT FROM public.profiles sibling WHERE sibling.user_id=p.user_id
      AND sibling.role='child' AND lower(trim(sibling.name))='rush'
    );
    INSERT INTO public.free_choice_profiles VALUES (target);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.free_choice_completions (
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  cents integer NOT NULL CHECK (cents BETWEEN 0 AND 10),
  PRIMARY KEY(profile_id,attempt_id)
);
ALTER TABLE public.free_choice_completions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.free_choice_completions FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.finish_free_choice(p_profile_id uuid, p_lesson_id uuid, p_attempt_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  owner_id uuid;
  lesson_type text;
  paid_kind text;
  amount integer;
  receipt public.free_choice_completions;
BEGIN
  SELECT p.user_id INTO owner_id FROM public.profiles p JOIN public.free_choice_profiles f ON f.profile_id=p.id
    WHERE p.id=p_profile_id AND p.user_id=auth.uid() AND p.role='child';
  IF owner_id IS NULL THEN RAISE EXCEPTION 'Free choice unavailable'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(p_profile_id::text));
  SELECT * INTO receipt FROM public.free_choice_completions r WHERE r.profile_id=p_profile_id AND r.attempt_id=p_attempt_id;
  IF FOUND THEN
    IF receipt.lesson_id IS DISTINCT FROM p_lesson_id THEN RAISE EXCEPTION 'Different lesson'; END IF;
    RETURN receipt.cents;
  END IF;
  SELECT l.lesson_type INTO STRICT lesson_type FROM public.lessons l WHERE l.id=p_lesson_id;
  paid_kind := CASE WHEN lesson_type='math_practice' THEN 'practice'
    WHEN EXISTS (SELECT FROM public.user_progress u WHERE u.profile_id=p_profile_id AND u.lesson_id=p_lesson_id AND u.status='completed')
      OR EXISTS (SELECT FROM public.wallet_entries w WHERE w.profile_id=p_profile_id AND w.lesson_id=p_lesson_id AND w.kind IN ('lesson','replay'))
      OR EXISTS (SELECT FROM public.child_daily_steps s WHERE s.profile_id=p_profile_id AND s.lesson_id=p_lesson_id AND s.completed)
      OR EXISTS (SELECT FROM public.free_choice_completions r WHERE r.profile_id=p_profile_id AND r.lesson_id=p_lesson_id)
      THEN 'replay' ELSE 'lesson' END;
  amount := least(CASE WHEN paid_kind='replay' THEN 5 ELSE 10 END, greatest(0,50-public.wallet_today(p_profile_id)));
  INSERT INTO public.free_choice_completions VALUES (p_profile_id,p_attempt_id,p_lesson_id,amount);
  INSERT INTO public.user_progress(user_id,profile_id,lesson_id,status,completed_at)
    VALUES(owner_id,p_profile_id,p_lesson_id,'completed',now())
    ON CONFLICT(profile_id,lesson_id) DO UPDATE SET status='completed',completed_at=now(),updated_at=now();
  IF amount>0 THEN
    INSERT INTO public.wallet_entries(user_id,profile_id,lesson_id,cents,kind)
    VALUES(owner_id,p_profile_id,p_lesson_id,amount,paid_kind);
  END IF;
  RETURN amount;
END $$;
REVOKE ALL ON FUNCTION public.finish_free_choice(uuid,uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_free_choice(uuid,uuid,uuid) TO authenticated;
COMMIT;
