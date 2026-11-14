-- Read-only. Paste after a failed hand-off script to see what the database has.
SELECT current_database() AS db,
  (SELECT count(*) FROM public.courses) AS courses,
  (SELECT count(*) FROM public.courses WHERE slug = 'math-facts') AS math_facts_course,
  (SELECT count(*) FROM public.flashcard_decks WHERE slug = 'math-facts') AS math_facts_deck,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_entries') AS wallet_table,
  (SELECT count(*) FROM pg_proc WHERE proname IN ('award_wallet', 'wallet_summary', 'wallet_today')) AS wallet_functions,
  (SELECT string_agg(conname || ': ' || pg_get_constraintdef(oid), ' | ') FROM pg_constraint WHERE conrelid = 'public.lessons'::regclass AND contype = 'c') AS lesson_checks;
