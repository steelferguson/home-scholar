-- Kids wallet: real cents earned for finished lessons and practice sets.
-- Run in the Supabase SQL Editor. Safe to re-run.
-- Rules (Steel, 2026-11-04 and 2026-11-14): 10 cents for a lesson the first
-- time, 5 cents for a replay, 10 cents for every practice set, at most 50
-- cents a day (midnight America/Chicago). Parents adjust with a reason.
-- Child profiles only; nothing is backdated.

CREATE TABLE IF NOT EXISTS public.wallet_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cents int NOT NULL CHECK (cents <> 0),
  kind text NOT NULL CHECK (kind IN ('lesson', 'replay', 'practice', 'adjustment')),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_adjustment_reason CHECK (kind <> 'adjustment' OR length(trim(reason)) > 0)
);
CREATE INDEX IF NOT EXISTS wallet_entries_profile ON public.wallet_entries(profile_id, created_at DESC);

ALTER TABLE public.wallet_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallet_select_own ON public.wallet_entries;
CREATE POLICY wallet_select_own ON public.wallet_entries FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
-- Only adjustments may be written directly; awards go through award_wallet().
DROP POLICY IF EXISTS wallet_insert_adjustment ON public.wallet_entries;
CREATE POLICY wallet_insert_adjustment ON public.wallet_entries FOR INSERT
  WITH CHECK (kind = 'adjustment' AND user_id = auth.uid()
    AND profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.wallet_today(p_profile_id uuid)
RETURNS int LANGUAGE sql STABLE AS $$
  SELECT coalesce(sum(cents), 0)::int FROM public.wallet_entries
  WHERE profile_id = p_profile_id AND kind <> 'adjustment'
    AND (created_at AT TIME ZONE 'America/Chicago')::date = (now() AT TIME ZONE 'America/Chicago')::date
$$;

-- The one place that decides an award. Returns the cents granted (0 when the
-- daily cap is reached) and the day's total afterwards.
DROP FUNCTION IF EXISTS public.award_wallet(uuid, text, uuid);
CREATE FUNCTION public.award_wallet(p_profile_id uuid, p_kind text, p_lesson_id uuid DEFAULT NULL)
RETURNS TABLE (cents int, earned_today int, cap int, kind text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cap int := 50;
  v_user uuid;
  v_kind text := p_kind;
  v_cents int;
  v_today int;
BEGIN
  SELECT user_id INTO v_user FROM public.profiles WHERE id = p_profile_id AND role = 'child';
  IF v_user IS NULL OR v_user <> auth.uid() THEN RAISE EXCEPTION 'not your child profile'; END IF;
  IF p_kind NOT IN ('lesson', 'practice') THEN RAISE EXCEPTION 'unknown award kind %', p_kind; END IF;
  -- One award at a time per profile so two tabs cannot both squeeze under the cap.
  PERFORM pg_advisory_xact_lock(hashtext(p_profile_id::text));
  IF p_kind = 'lesson' THEN
    IF p_lesson_id IS NULL THEN RAISE EXCEPTION 'lesson award needs a lesson'; END IF;
    IF EXISTS (SELECT 1 FROM public.wallet_entries w WHERE w.profile_id = p_profile_id AND w.lesson_id = p_lesson_id AND w.kind = 'lesson')
      THEN v_kind := 'replay'; END IF;
  END IF;
  v_cents := CASE v_kind WHEN 'replay' THEN 5 ELSE 10 END;
  v_today := public.wallet_today(p_profile_id);
  v_cents := least(v_cents, greatest(0, v_cap - v_today));
  IF v_cents > 0 THEN
    INSERT INTO public.wallet_entries (user_id, profile_id, cents, kind, lesson_id)
    VALUES (v_user, p_profile_id, v_cents, v_kind, p_lesson_id);
    v_today := v_today + v_cents;
  END IF;
  RETURN QUERY SELECT v_cents, v_today, v_cap, v_kind;
END $$;
REVOKE ALL ON FUNCTION public.award_wallet(uuid, text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.award_wallet(uuid, text, uuid) TO authenticated;

-- Balance and today's total for every child profile the caller owns.
CREATE OR REPLACE FUNCTION public.wallet_summary()
RETURNS TABLE (profile_id uuid, balance int, earned_today int, cap int)
LANGUAGE sql STABLE AS $$
  SELECT p.id, coalesce(sum(w.cents), 0)::int, public.wallet_today(p.id), 50
  FROM public.profiles p LEFT JOIN public.wallet_entries w ON w.profile_id = p.id
  WHERE p.user_id = auth.uid() AND p.role = 'child'
  GROUP BY p.id
$$;
