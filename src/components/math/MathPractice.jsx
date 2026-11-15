import { useState, useMemo } from 'react'
import confetti from 'canvas-confetti'
import { useLessonContent } from '../../hooks/useLessonContent'
import { useFactStats } from '../../hooks/useFactStats'
import { useFamily } from '../../hooks/useFamily'
import { useWallet } from '../../hooks/useWallet'
import EarnedBanner from '../wallet/EarnedBanner'
import { allFacts, buildSet, createSession } from '../../lib/mathFacts'
import Keypad from './Keypad'

const shell = 'min-h-screen bg-gradient-to-b from-emerald-400 to-teal-700 text-white flex flex-col'

// Full-screen kids practice: intro -> 20 typed answers -> results.
// Wrong answers show the right one and come back at the end of the set.
export default function MathPractice({ lesson, onExit, onComplete }) {
  const { content, error } = useLessonContent(lesson.content_url)
  const stats = useFactStats()
  const { active } = useFamily()
  const wallet = useWallet()
  const [earned, setEarned] = useState(null)
  const [earnError, setEarnError] = useState(null)
  const [round, setRound] = useState(0)
  const [screen, setScreen] = useState('intro') // intro | practice | results
  const [typed, setTyped] = useState('')
  const [feedback, setFeedback] = useState(null) // wrong answer: { fact, typed }
  const [flash, setFlash] = useState(false) // brief "Yes!" after a correct answer; typing continues
  const [, setTick] = useState(0) // the session object mutates; bump to re-render
  const [summary, setSummary] = useState(null)
  const session = useMemo(() => {
    if (!content || !stats.ready) return null
    return createSession(buildSet(allFacts(content.operation), stats.stats, content.questions || 20))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, stats.ready, round])

  const finish = async () => {
    const result = session.summary()
    setSummary(result); setScreen('results'); setEarned(null); setEarnError(null)
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } })
    try { setEarned(await wallet.award(active, 'practice', lesson.id)) } catch (err) { setEarnError(err.message) }
    try { await stats.record(result) } catch { /* stats only steer the next set */ }
    try { await onComplete() } catch { /* progress notice shows the failure */ }
  }
  const submit = () => {
    if (typed === '' || feedback) return
    const outcome = { ...session.answer(typed), typed }
    setTyped('')
    if (outcome.correct) {
      // Move on at once so the next taps are never dropped; the flash is only a cheer.
      setTick(t => t + 1); setFlash(true)
      setTimeout(() => setFlash(false), 500)
      if (session.done) finish()
    } else { setFlash(false); setFeedback(outcome) }
  }
  const next = () => { setFeedback(null); setTick(t => t + 1) }
  const playAgain = () => { setSummary(null); setTyped(''); setFeedback(null); setRound(r => r + 1); setScreen('practice') }

  if (error) return <div className={`${shell} items-center justify-center gap-4`}>
    <p className="text-2xl font-bold">Oops! This practice wouldn&apos;t load.</p>
    <button onClick={onExit} className="bg-white text-teal-800 font-bold rounded-full px-6 py-2">Go back</button>
  </div>
  if (!session) return <div className={`${shell} items-center justify-center`}><div className="text-3xl animate-bounce">🔢 Loading...</div></div>

  const header = <div className="flex items-center justify-between px-4 py-3">
    <button onClick={onExit} aria-label="Exit" className="bg-white/20 hover:bg-white/30 rounded-full w-12 h-12 text-xl font-bold">✕</button>
    {screen === 'practice' && <div className="flex-1 mx-4 h-4 bg-white/20 rounded-full overflow-hidden" role="progressbar" aria-label="Questions answered" aria-valuenow={session.answered} aria-valuemin={0} aria-valuemax={session.total}>
      <div className="h-full bg-yellow-300 transition-all" style={{ width: `${session.answered / session.total * 100}%` }} />
    </div>}
    {screen === 'practice' && <span className="text-lg font-bold tabular-nums">{session.answered} / {session.total}</span>}
  </div>

  if (screen === 'intro') return <div className={shell}>{header}
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-6xl">🔢</p>
      <h1 className="text-4xl font-extrabold">{lesson.title}</h1>
      <p className="text-xl opacity-90">{session.total} questions. Type each answer, then press ✓.</p>
      <button onClick={() => setScreen('practice')} className="bg-yellow-300 text-teal-900 text-2xl font-extrabold rounded-full px-12 py-4 shadow-lg">Start</button>
    </div>
  </div>

  if (screen === 'results') return <div className={shell}>{header}
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-6xl">{summary.firstTry === summary.total ? '🌟' : '🎉'}</p>
      <h1 className="text-4xl font-extrabold">Set complete!</h1>
      <p className="text-2xl">{summary.firstTry} of {summary.total} right the first time</p>
      <EarnedBanner earned={earned} error={earnError} className="text-yellow-300" />
      <div className="flex gap-4">
        <button onClick={playAgain} className="bg-yellow-300 text-teal-900 text-xl font-extrabold rounded-full px-8 py-3 shadow-lg">Play again</button>
        <button onClick={onExit} className="bg-white/20 text-xl font-bold rounded-full px-8 py-3">Done</button>
      </div>
    </div>
  </div>

  const wrong = Boolean(feedback && !feedback.correct)
  const display = wrong ? feedback.fact : session.current
  if (!display) return null // the last answer just landed; results are on their way
  return <div className={shell}>{header}
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
      {/* Wrong: the child's answer in red with a line through it, the right one bright yellow. */}
      <div className={`text-6xl sm:text-7xl font-extrabold tabular-nums flex items-center gap-4 ${flash ? 'text-yellow-300' : ''}`} aria-live="polite">
        <span>{display.a}</span><span>{display.op}</span><span>{display.b}</span><span>=</span>
        {wrong && <span className="text-red-400 line-through decoration-8 bg-red-950/40 rounded-2xl px-4" data-testid="wrong">{feedback.typed}</span>}
        <span className={`min-w-[2ch] text-center rounded-2xl px-4 ${wrong ? 'bg-yellow-300 text-teal-900 ring-8 ring-yellow-200/60' : 'bg-white/20'}`} data-testid="answer">{wrong ? feedback.fact.answer : (typed || '\u00a0')}</span>
      </div>
      <p className={`text-2xl font-bold h-8 ${wrong ? 'text-red-300' : ''}`}>{wrong ? `Not quite. It’s ${feedback.fact.answer}. You’ll see this one again.` : flash ? 'Yes!' : '\u00a0'}</p>
      {wrong
        ? <button onClick={next} className="bg-yellow-300 text-teal-900 text-2xl font-extrabold rounded-full px-12 py-4 shadow-lg">Got it</button>
        : <Keypad value={typed} onChange={setTyped} onSubmit={submit} />}
    </div>
  </div>
}
