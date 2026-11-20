-- Apply after setup_wallet.sql. All five slots are fixed when the child first
-- opens the plan that day. A completed slot is also the award receipt.
BEGIN;
CREATE TABLE IF NOT EXISTS public.child_daily_steps (
  profile_id uuid REFERENCES public.profiles ON DELETE CASCADE,
  school_day date NOT NULL,
  slot integer CHECK (slot BETWEEN 1 AND 5),
  lesson_id uuid NOT NULL REFERENCES public.lessons,
  completed boolean NOT NULL DEFAULT false,
  cents integer NOT NULL DEFAULT 0,
  PRIMARY KEY (profile_id, school_day, slot)
);
ALTER TABLE public.child_daily_steps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.child_daily_steps FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.daily_plan(p_profile_id uuid)
RETURNS TABLE (school_day date, slot integer, lesson_id uuid, slug text, lesson_number integer, title text, completed boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  today date := (now() AT TIME ZONE 'America/Chicago')::date;
BEGIN
  IF NOT EXISTS (SELECT FROM public.profiles p WHERE p.id=p_profile_id AND p.role='child' AND p.user_id=auth.uid())
    THEN RAISE EXCEPTION 'Child profile unavailable'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(p_profile_id::text));
  IF NOT EXISTS (SELECT FROM public.child_daily_steps s WHERE s.profile_id=p_profile_id AND s.school_day=today) THEN
    INSERT INTO public.child_daily_steps(profile_id,school_day,slot,lesson_id)
    SELECT p_profile_id,today,n,l.id FROM generate_series(1,4) n
    JOIN public.courses c ON c.slug='math-facts'
    JOIN public.lessons l ON l.course_id=c.id AND l.lesson_number=least(n,3) AND l.lesson_type='math_practice'
    UNION ALL
    SELECT p_profile_id,today,5,sp.id FROM (
      SELECT l.id FROM public.lessons l JOIN public.courses c ON l.course_id=c.id
      LEFT JOIN public.user_progress u ON u.profile_id=p_profile_id AND u.lesson_id=l.id
      WHERE c.slug='spanish-kids-1' AND l.lesson_type='quiz_game'
      ORDER BY (u.status='completed' OR EXISTS (SELECT FROM public.child_daily_steps s
        WHERE s.profile_id=p_profile_id AND s.lesson_id=l.id AND s.completed)) IS TRUE,
        (SELECT max(s.school_day) FROM public.child_daily_steps s
         WHERE s.profile_id=p_profile_id AND s.lesson_id=l.id AND s.completed) NULLS FIRST, l.lesson_number LIMIT 1
    ) sp;
    IF (SELECT count(*) FROM public.child_daily_steps s WHERE s.profile_id=p_profile_id AND s.school_day=today) <> 5
      THEN RAISE EXCEPTION 'Plan lessons unavailable'; END IF;
  END IF;
  RETURN QUERY SELECT s.school_day,s.slot,l.id,c.slug::text,l.lesson_number::integer,l.title::text,s.completed
    FROM public.child_daily_steps s JOIN public.lessons l ON l.id=s.lesson_id JOIN public.courses c ON c.id=l.course_id
    WHERE s.profile_id=p_profile_id AND s.school_day=today ORDER BY s.slot;
END $$;

CREATE OR REPLACE FUNCTION public.finish_daily_step(p_profile_id uuid,p_day date,p_slot integer,p_lesson_id uuid)
RETURNS TABLE(cents integer,earned_today integer,cap integer,kind text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  child_user uuid;
  step public.child_daily_steps;
  amount integer;
  award_kind text;
BEGIN
  SELECT p.user_id INTO child_user FROM public.profiles p WHERE p.id=p_profile_id AND p.role='child' AND p.user_id=auth.uid();
  IF child_user IS NULL THEN RAISE EXCEPTION 'Child profile unavailable'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(p_profile_id::text));
  IF p_day IS DISTINCT FROM (now() AT TIME ZONE 'America/Chicago')::date THEN RAISE EXCEPTION 'Open today’s plan'; END IF;
  SELECT * INTO step FROM public.child_daily_steps s WHERE s.profile_id=p_profile_id AND s.school_day=p_day AND s.slot=p_slot AND s.lesson_id=p_lesson_id;
  IF NOT FOUND OR EXISTS (SELECT FROM public.child_daily_steps s WHERE s.profile_id=p_profile_id AND s.school_day=p_day AND s.slot<p_slot AND NOT s.completed)
    THEN RAISE EXCEPTION 'Open the next step'; END IF;
  award_kind := CASE WHEN p_slot<5 THEN 'practice' WHEN EXISTS (SELECT FROM public.wallet_entries w
    WHERE w.profile_id=p_profile_id AND w.lesson_id=p_lesson_id AND w.kind IN ('lesson','replay'))
    OR EXISTS (SELECT FROM public.user_progress u WHERE u.profile_id=p_profile_id AND u.lesson_id=p_lesson_id AND u.status='completed')
    OR EXISTS (SELECT FROM public.child_daily_steps s WHERE s.profile_id=p_profile_id AND s.lesson_id=p_lesson_id AND s.completed AND s.school_day<p_day)
    THEN 'replay' ELSE 'lesson' END;
  IF step.completed THEN amount := step.cents;
  ELSE
    amount := least(CASE WHEN award_kind='replay' THEN 5 ELSE 10 END,greatest(0,50-public.wallet_today(p_profile_id)));
    UPDATE public.child_daily_steps s SET completed=true,cents=amount WHERE s.profile_id=p_profile_id AND s.school_day=p_day AND s.slot=p_slot;
    IF amount>0 THEN
      INSERT INTO public.wallet_entries(user_id,profile_id,cents,kind,lesson_id) VALUES(child_user,p_profile_id,amount,award_kind,p_lesson_id);
    END IF;
  END IF;
  RETURN QUERY SELECT amount,public.wallet_today(p_profile_id),50,award_kind;
END $$;
REVOKE ALL ON FUNCTION public.daily_plan(uuid), public.finish_daily_step(uuid,date,integer,uuid), public.award_wallet(uuid,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.daily_plan(uuid), public.finish_daily_step(uuid,date,integer,uuid) TO authenticated;
COMMIT;
