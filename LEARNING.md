# How Steel Is Learning — overview for a learning-plan session

Read this if you're helping Steel build or update a **learning plan**. It captures
the whole learning system: the app, the full course catalog, the hands-on drills,
the study method that works, and where the current goals live. Then go read the
two trackers linked at the bottom before proposing a plan.

App is live at **home-scholar-app.vercel.app**. This repo is the app; the audio
generation and coding drills live in sibling `projects/` folders (noted below).

---

## 1. What Home Scholar is

A self-paced learning web app (React + Vite + Tailwind + Supabase). Three lesson
types:
- **audio** — Pimsleur-style spoken lessons (languages, music, and interview-prep
  courses meant for passive/repeat listening). MP3s in Supabase Storage.
- **visual** — interactive JSON step-arrays (text / quiz / image / math / widget)
  rendered by the app. Used for adult ML/AI explainers and interview prep.
- **quiz_game** — kid mode (Spanish for ages 6-8): question rounds earn coins that
  buy arcade rounds.

See `CLAUDE.md` in this repo for the architecture and the "how to add a lesson"
mechanics.

---

## 2. Full course catalog (23 courses, from Supabase)

### Career / interview prep — the active focus (adult)
**Audio (listen on repeat):**
- `mle-interview` — Staff MLE & AI Engineering Interview Prep (20 lessons)
- `fraud-abuse-audio` — Fraud & Abuse ML (7) — *built for the current Block loop*
- `humanity-ramp-audio` — Humanity Labs Ramp-Up (8) — agentic-eng ramp
- `audio-interview-prep` — Audio Prep: System Design & Data Modeling (6)

**Visual (active study):**
- `ai-systems-design` — AI Systems Design (13): agents, serving, RAG, memory, evals, recommender, capstone
- `coding-with-ai` — Coding With AI (15): specifying to AI, the plan-first build loop, driving the agent live
- `llm-training-scale` — LLM Training at Scale (8): tokenization, embeddings, distributed training, GPU efficiency
- `mle-coding-refresh` — MLE Coding Refresh (9): ML from scratch, sklearn/GBM, beam search, debugging
- `practical-python` — Practical Python Speed-Run (6): syntax recall for timed screens
- `pytorch-speedrun` — PyTorch Speed-Run (5): torch API + autograd intuition
- `reddit-coding` — Reddit Coding Interview (7): state machines, composition, replay, trees, throttling
- `pipeline-craft` — Pipeline Craft (4): what makes a good data/ML pipeline + fixing a messy PyTorch one
- `ml-interview-visual` — ML Interview Visual Walkthroughs (6): tokenization, log loss, softmax, gradient descent, embeddings, attention

### Languages (audio)
- `czech-1` (30), `czech-2` (30), `czech-grammar` (10)
- `spanish-1` (30), `spanish-grammar` (10)
- `english-connect-1` (14)

### Music (audio)
- `harmony-1` — Harmony & Music Theory (40, uses LDS hymns + MIDI pipeline)
- `beatboxing` (12)

### Other (audio)
- `history-ussr` — Rise and Fall of the USSR (12)

### Kids
- `spanish-kids-1` — Spanish Quest (quiz_game, 3)

---

## 3. Hands-on drills & references (NOT in this app — in `projects/mle_interview/`)

The courses teach; these are where Steel *practices*. Under
`/Users/steelferguson/daily_sessions/projects/mle_interview/`:
- `handcoding/` — coding drills, all runnable: `p01`-`p15` (ML/Python from memory),
  `r01`-`r06` (Reddit patterns), `d01`-`d03` (debugging), `REDDIT_PREP.md`, `TLDR.md`.
- `handcoding/anthropic_ica/` — the Anthropic/Constellation ICA prep: `numpy_drill.py`
  (NumPy/NamedTuple/recursion fluency) + a `readings.py` broken-codebase mock with
  `unittest` + solution + `PREP.md`.
- `pipeline_examples/` — clean "done" reference files: `good_pipeline_document_processor.py`
  (multi-LLM pipeline), `good_pipeline_pytorch_training.py` (clean training pipeline),
  and a build-prompt for solo practice.
- `system_design/` — worked design references: `daily_log_violation_system.md`,
  `data_modeling_method.md` + `data_modeling_drills.md`, `fraud_abuse_ml_primer.md`,
  `fraud_detection_architecture.md`.

Audio courses are generated in sibling folders (`projects/fraud_abuse_audio/`,
`projects/humanity_ramp_audio/`, `projects/interview_audio/`, the language projects):
each has `lessons/lesson_NN.py` (SEGMENTS), a `generator.py` (Google TTS + pydub,
REST transport), `build.py`, and `register_and_upload.py` (Supabase).

---

## 4. The study method that works (use this in any plan)

- **Active recall over re-reading.** The highest-value mode: Claude asks a question,
  Steel answers from memory, Claude grades and fills gaps, then escalates to a mock.
  (This is what closed the fraud-domain gaps fastest.)
- **Live mocks.** Claude plays the interviewer (system design, coding, behavioral,
  live-build) and grades against the real rubric. Steel drives; Claude does not solve
  it for him.
- **Walk-through teaching.** Lessons introduce ONE concept per step, show outputs,
  explain before code. Dense reference blocks belong in TLDRs, not lessons.
  (See memory `feedback_teaching_walk_through`.)
- **Audio for passive absorption**, visual for active study, drills for reps.
- **No em dashes** in any content (Steel removes them).

---

## 5. Current goal (as of this writing)

**Block — Staff Applied ML Engineer, Fraud & Abuse.** A 4-interview loop
(Architecture & Design, Leadership/Values behavioral, Live Build with AI, team
rounds). Prep materials: the fraud audio course + the `system_design/` fraud docs.
Study is mid-flight; strengths and gaps are tracked.

Other threads from the broader job search (METR, Reddit, Humanity Labs, Anthropic
Fellowship, Cresta, Arena) are in the master context doc.

---

## 6. Read these before building a learning plan

- `project_notes/job-search/block_fraud_prep.md` — the live Block tracker: loop,
  built materials, **study-progress strong-vs-shore-up**, next steps.
- `project_notes/job-search/steel_master_context.md` — full work history, skills,
  honest gaps, career direction, all interview threads. **The single best context doc.**
- Memory index: `~/.claude/projects/-Users-steelferguson-daily-sessions/memory/MEMORY.md`
  (has `project_block_fraud_prep`, `project_job_search_master`, `project_home_scholar`,
  and the teaching-style feedback entries).

A good learning plan starts from the **target role's interview loop**, maps each
interview to existing courses/drills (reuse first), identifies gaps to build, and
schedules **active-recall + mock** sessions, not just content consumption.
