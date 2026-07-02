import { useState } from 'react'

export default function QuizStep({ question, choices, answer, explain }) {
  const [selected, setSelected] = useState(null)
  const isCorrect = selected === answer

  const choiceStyle = (i) => {
    if (selected === null) return 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
    if (i === answer) return 'border-green-500 bg-green-50 text-green-800'
    if (i === selected) return 'border-red-400 bg-red-50 text-red-700'
    return 'border-gray-200 opacity-60'
  }

  return (
    <div className="my-4">
      <p className="font-medium text-gray-900 mb-3">
        <span className="text-blue-600 mr-2">Check yourself:</span>
        {question}
      </p>
      <div className="grid gap-2">
        {choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            disabled={selected !== null && isCorrect}
            className={`text-left px-4 py-2.5 rounded-lg border transition ${choiceStyle(i)}`}
          >
            {choice}
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className={`mt-3 text-sm rounded-lg p-3 ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
          {isCorrect ? '✓ Correct. ' : 'Not quite — try again. '}
          {(isCorrect || !explain) ? explain : ''}
        </div>
      )}
    </div>
  )
}
