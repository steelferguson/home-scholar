import { useState, useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { speakSpanish } from '../../lib/speech'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const smallBurst = () => confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } })

/* ---------- Tap the picture / Listen and choose ---------- */
function TapPicture({ question, hidePromptText, onDone }) {
  const [wrong, setWrong] = useState([])
  const [answered, setAnswered] = useState(false)

  const play = useCallback(() => speakSpanish(question.prompt_es, question.audio_url), [question])
  useEffect(() => { play() }, [play])

  const pick = (i) => {
    if (answered) return
    if (i === question.answer) {
      setAnswered(true)
      smallBurst()
      setTimeout(() => onDone(wrong.length === 0), 1100)
    } else {
      setWrong(w => [...w, i])
      speakSpanish(question.prompt_es, question.audio_url)
    }
  }

  return (
    <div>
      <button
        onClick={play}
        className="mx-auto flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg text-2xl font-bold text-indigo-700 hover:scale-105 transition mb-6 animate-bounce-in"
      >
        <span className="text-3xl">🔊</span>
        {hidePromptText && !answered ? '¿ ... ?' : question.prompt_es}
      </button>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {question.choices.map((choice, i) => {
          const isWrong = wrong.includes(i)
          const isRight = answered && i === question.answer
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={isWrong || answered}
              className={`rounded-3xl p-5 shadow-lg text-center transition transform ${
                isRight ? 'bg-green-300 animate-pop' :
                isWrong ? 'bg-red-200 opacity-50 animate-shake' :
                'bg-white hover:scale-105 active:scale-95'
              }`}
            >
              <div className="text-6xl mb-1">{choice.emoji}</div>
              {(answered || isWrong) && <div className="text-sm font-bold text-gray-600">{choice.label}</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Match the pairs ---------- */
function MatchPairs({ question, onDone }) {
  const [left] = useState(() => shuffle(question.pairs.map(p => p.es)))
  const [right] = useState(() => shuffle(question.pairs.map(p => p.emoji)))
  const [selectedWord, setSelectedWord] = useState(null)
  const [matched, setMatched] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [shakeEmoji, setShakeEmoji] = useState(null)

  const emojiFor = (es) => question.pairs.find(p => p.es === es).emoji

  const pickEmoji = (emoji) => {
    if (!selectedWord || matched.includes(emoji)) return
    if (emojiFor(selectedWord) === emoji) {
      const next = [...matched, emoji]
      setMatched(next)
      setSelectedWord(null)
      speakSpanish(selectedWord)
      if (next.length === question.pairs.length) {
        smallBurst()
        setTimeout(() => onDone(mistakes === 0), 1100)
      }
    } else {
      setMistakes(m => m + 1)
      setShakeEmoji(emoji)
      setTimeout(() => setShakeEmoji(null), 450)
    }
  }

  return (
    <div>
      <p className="text-center text-white text-2xl font-bold mb-6 drop-shadow">Match the pairs!</p>
      <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
        <div className="space-y-3">
          {left.map(es => {
            const done = matched.includes(emojiFor(es))
            return (
              <button
                key={es}
                onClick={() => { if (!done) { setSelectedWord(es); speakSpanish(es) } }}
                disabled={done}
                className={`w-full rounded-2xl py-3 px-2 text-lg font-bold shadow transition ${
                  done ? 'bg-green-300 text-green-800' :
                  selectedWord === es ? 'bg-indigo-600 text-white scale-105' :
                  'bg-white text-indigo-700 hover:scale-105'
                }`}
              >
                {es}
              </button>
            )
          })}
        </div>
        <div className="space-y-3">
          {right.map(emoji => (
            <button
              key={emoji}
              onClick={() => pickEmoji(emoji)}
              disabled={matched.includes(emoji)}
              className={`w-full rounded-2xl py-2 text-4xl shadow transition ${
                matched.includes(emoji) ? 'bg-green-300' :
                shakeEmoji === emoji ? 'bg-red-200 animate-shake' :
                'bg-white hover:scale-105'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Build the sentence ---------- */
function WordOrder({ question, onDone }) {
  const [available, setAvailable] = useState(() => shuffle(question.words.map((w, i) => ({ w, id: i }))))
  const [placed, setPlaced] = useState([])
  const [status, setStatus] = useState(null) // null | 'wrong' | 'right'
  const [mistakes, setMistakes] = useState(0)

  const place = (tile) => {
    setAvailable(a => a.filter(t => t.id !== tile.id))
    setPlaced(p => [...p, tile])
    setStatus(null)
  }
  const unplace = (tile) => {
    setPlaced(p => p.filter(t => t.id !== tile.id))
    setAvailable(a => [...a, tile])
    setStatus(null)
  }

  const check = () => {
    const answer = placed.map(t => t.w).join(' ')
    if (answer === question.words.join(' ')) {
      setStatus('right')
      speakSpanish(answer)
      smallBurst()
      setTimeout(() => onDone(mistakes === 0), 1300)
    } else {
      setStatus('wrong')
      setMistakes(m => m + 1)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <p className="text-center text-white text-2xl font-bold mb-2 drop-shadow">Build the sentence!</p>
      <p className="text-center text-indigo-100 text-lg mb-6">&ldquo;{question.prompt_en}&rdquo;</p>

      <div className={`bg-white/90 rounded-2xl min-h-16 p-3 flex flex-wrap gap-2 items-center justify-center mb-6 shadow-inner ${status === 'wrong' ? 'animate-shake' : ''}`}>
        {placed.length === 0 && <span className="text-gray-400">Tap the words below</span>}
        {placed.map(tile => (
          <button
            key={tile.id}
            onClick={() => unplace(tile)}
            className={`rounded-xl px-3 py-2 text-lg font-bold shadow ${status === 'right' ? 'bg-green-300 text-green-900' : 'bg-indigo-600 text-white'}`}
          >
            {tile.w}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-6 min-h-12">
        {available.map(tile => (
          <button
            key={tile.id}
            onClick={() => place(tile)}
            className="bg-white rounded-xl px-3 py-2 text-lg font-bold text-indigo-700 shadow hover:scale-105 transition"
          >
            {tile.w}
          </button>
        ))}
      </div>

      {available.length === 0 && status !== 'right' && (
        <button
          onClick={check}
          className="block mx-auto bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-xl font-black rounded-full px-8 py-3 shadow-lg transition hover:scale-105"
        >
          Check! ✓
        </button>
      )}
      {status === 'wrong' && <p className="text-center text-white font-bold mt-3">Almost! Tap words to move them around.</p>}
    </div>
  )
}

/* ---------- Round driver ---------- */
export default function QuestionRound({ questions, coinPerCorrect, onRoundEnd }) {
  const [index, setIndex] = useState(0)
  const [firstTryCorrect, setFirstTryCorrect] = useState(0)
  const [coins, setCoins] = useState(0)
  const [coinPop, setCoinPop] = useState(false)

  const question = questions[index]

  const handleDone = (wasFirstTry) => {
    const nextCorrect = firstTryCorrect + (wasFirstTry ? 1 : 0)
    const nextCoins = coins + (wasFirstTry ? coinPerCorrect : 1)
    setFirstTryCorrect(nextCorrect)
    setCoins(nextCoins)
    setCoinPop(true)
    setTimeout(() => setCoinPop(false), 400)
    if (index + 1 < questions.length) {
      setIndex(index + 1)
    } else {
      setTimeout(() => onRoundEnd(nextCorrect, questions.length, nextCoins), 600)
    }
  }

  return (
    <div className="px-4 pb-8">
      {/* Round progress + coins */}
      <div className="max-w-md mx-auto flex items-center gap-3 mb-8">
        <div className="flex-1 bg-white/30 rounded-full h-4 overflow-hidden">
          <div
            className="bg-yellow-400 h-4 rounded-full transition-all duration-500"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
        <span className={`text-white font-black text-lg ${coinPop ? 'animate-pop' : ''}`}>+{coins} 🪙</span>
      </div>

      {question.type === 'tap-picture' && (
        <TapPicture key={index} question={question} hidePromptText={false} onDone={handleDone} />
      )}
      {question.type === 'listen-choose' && (
        <TapPicture key={index} question={question} hidePromptText onDone={handleDone} />
      )}
      {question.type === 'match-pairs' && (
        <MatchPairs key={index} question={question} onDone={handleDone} />
      )}
      {question.type === 'word-order' && (
        <WordOrder key={index} question={question} onDone={handleDone} />
      )}
    </div>
  )
}
