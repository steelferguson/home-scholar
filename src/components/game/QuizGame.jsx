import { useFreeChoiceFinish } from '../../hooks/useFreeChoiceFinish'
import { useRef, useState, lazy, Suspense } from 'react'
import confetti from 'canvas-confetti'
import { usePlayerState } from '../../hooks/usePlayerState'
import { useLessonContent } from '../../hooks/useLessonContent'
import { useFamily } from '../../hooks/useFamily'
import { useWallet } from '../../hooks/useWallet'
import EarnedBanner from '../wallet/EarnedBanner'
import RewardBar from './RewardBar'
import QuestionRound from './QuestionRound'
import { DEFAULT_COIN_PER_CORRECT, DEFAULT_ARCADE_COST, DEFAULT_ARCADE_SECONDS } from './constants'

// The arcade pulls in the kaplay game engine — only load it when a round is won
const ArcadeGame = lazy(() => import('./ArcadeGame'))

// Full-screen kids experience: intro → question round → results → arcade reward
export default function QuizGame({ user, lesson, onExit, onComplete, finishPlan, extraPractice }) {
  const { content, error } = useLessonContent(lesson.content_url)
  const [screen, setScreen] = useState('intro') // intro | round | results | arcade
  const [roundResult, setRoundResult] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [coinsBanked, setCoinsBanked] = useState(false)
  const { playerState, recordQuizResult, spendCoins } = usePlayerState(user.id)
  const { active } = useFamily()
  const wallet = useWallet()
  const freeFinish = useFreeChoiceFinish()
  const attempt = useRef(null)
  const finishRound = () => {
    attempt.current ??= crypto.randomUUID()
    if (freeFinish) return freeFinish(lesson.id, attempt.current)
    if (finishPlan) return finishPlan(lesson.id)
    return wallet.award(active, 'lesson', lesson.id)
  }
  const [earned, setEarned] = useState(null)
  const [earnError, setEarnError] = useState(null)

  const arcadeCost = content?.arcade_cost ?? DEFAULT_ARCADE_COST
  const arcadeSeconds = content?.arcade_seconds ?? DEFAULT_ARCADE_SECONDS

  const handleRoundEnd = async (correct, total, coinsEarned) => {
    // Replays are practice: results still celebrate, but coins bank only once
    const banked = !coinsBanked
    setRoundResult({ correct, total, coinsEarned, banked })
    setScreen('results'); setEarned(null); setEarnError(null)
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } })
    // Real money: the database pays 10 cents the first time and 5 for a replay, under the daily cap.
    try { setEarned(await finishRound()) }
    catch { setEarnError('Couldn’t save this step.'); return }
    if (banked) {
      setCoinsBanked(true)
      try {
        await recordQuizResult(lesson.id, correct, total, coinsEarned)
        if (!freeFinish) onComplete()
      } catch { setSaveError('Your result could not be fully saved. Please ask a parent to check your connection.') }
    }
  }

  const pending = (finishPlan || freeFinish) && screen === 'results' && !earned && !earnError
  const startArcade = async () => {
    try {
      if (await spendCoins(arcadeCost)) setScreen('arcade')
    } catch { setSaveError('Your coins could not be loaded or saved. Please try again.') }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600 flex flex-col items-center justify-center text-white gap-4">
        <p className="text-2xl font-bold">Oops! This lesson wouldn&apos;t load.</p>
        <button onClick={onExit} className="bg-white text-indigo-700 font-bold rounded-full px-6 py-2">Go back</button>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600 flex items-center justify-center">
        <div className="text-white text-3xl animate-bounce">🎈 Loading...</div>
      </div>
    )
  }

  if (screen === 'arcade') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-indigo-950 flex items-center justify-center text-white text-3xl animate-bounce">
          🕹 Loading arcade...
        </div>
      }>
        <ArcadeGame
          words={content.words || []}
          seconds={arcadeSeconds}
          onEnd={() => setScreen('results')}
        />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600">
      <RewardBar coins={playerState.coins} streak={playerState.streak_days} onExit={pending ? undefined : onExit} />

      {saveError && <p role="alert" className="p-4 text-center text-white">{saveError}</p>}

      {screen === 'intro' && (
        <div className="flex flex-col items-center justify-center px-6 pt-16 text-center">
          <div className="text-7xl mb-4 animate-bounce-in">{content.icon || '⭐'}</div>
          <h1 className="text-4xl font-black text-white drop-shadow mb-3">{content.title}</h1>
          <p className="text-indigo-100 text-xl mb-2">{content.questions.length} questions</p>
          <p className="text-indigo-100 text-lg mb-10">
            Earn 🪙 for each answer — then play the arcade!
          </p>
          <button
            onClick={() => setScreen('round')}
            className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-2xl font-black rounded-full px-12 py-4 shadow-xl transition hover:scale-105 animate-bounce-in"
          >
            Let&apos;s go! 🚀
          </button>
        </div>
      )}

      {screen === 'round' && (
        <QuestionRound
          questions={content.questions}
          coinPerCorrect={content.coin_per_correct ?? DEFAULT_COIN_PER_CORRECT}
          onRoundEnd={handleRoundEnd}
        />
      )}

      {screen === 'results' && roundResult && (
        <div className="flex flex-col items-center justify-center px-6 pt-12 text-center">
          <div className="text-7xl mb-4 animate-bounce-in">
            {roundResult.correct === roundResult.total ? '🏆' : roundResult.correct >= roundResult.total / 2 ? '🌟' : '💪'}
          </div>
          <h1 className="text-4xl font-black text-white drop-shadow mb-2">
            {roundResult.correct === roundResult.total ? '¡Perfecto!' : '¡Muy bien!'}
          </h1>
          <p className="text-white text-2xl font-bold mb-1">
            {roundResult.correct} / {roundResult.total} first try
          </p>
          {roundResult.banked && !saveError ? (
            <p className="text-yellow-300 text-3xl font-black mb-10 animate-pop">+{roundResult.coinsEarned} 🪙</p>
          ) : (
            <p className="text-indigo-100 text-xl font-bold mb-10">Great practice! 💪</p>
          )}
          <EarnedBanner earned={earned} error={earnError} className="text-green-200 -mt-6 mb-8" />

          {pending && <p role="status">Saving your lesson…</p>}
          {earnError && (finishPlan || freeFinish) && <button onClick={() => handleRoundEnd(roundResult.correct, roundResult.total, roundResult.coinsEarned)}>Retry save</button>}
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button
              onClick={startArcade}
              disabled={pending || playerState.coins < arcadeCost}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:hover:bg-yellow-400 text-yellow-900 text-xl font-black rounded-full px-8 py-4 shadow-xl transition hover:scale-105"
            >
              🕹 Play Arcade! ({arcadeCost} 🪙)
            </button>
            {playerState.coins < arcadeCost && (
              <p className="text-indigo-100 text-sm">Earn {arcadeCost - playerState.coins} more 🪙 to unlock the arcade</p>
            )}
            {(!finishPlan || extraPractice) && <button
              disabled={pending} onClick={() => { attempt.current = null; setScreen('round'); setRoundResult(null) }}
              className="bg-white/20 hover:bg-white/30 text-white text-lg font-bold rounded-full px-8 py-3 transition"
            >
              Practice again
            </button>}
            <button
              disabled={pending}
              onClick={onExit}
              className="text-indigo-100 hover:text-white font-bold py-2"
            >
              All done for today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
