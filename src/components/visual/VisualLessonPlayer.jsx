import { useState, useEffect, useCallback, useRef } from 'react'
import { useLessonContent } from '../../hooks/useLessonContent'
import StepRenderer from './StepRenderer'

export default function VisualLessonPlayer({ lesson, savedStep, isCompleted, onSaveStep, onMarkComplete }) {
  const { content, error } = useLessonContent(lesson.content_url)
  const [stepIndex, setStepIndex] = useState(0)
  const restoredRef = useRef(false)
  const saveTimerRef = useRef(null)
  const saveRef = useRef({ onSaveStep, pending: null })
  saveRef.current.onSaveStep = onSaveStep

  const steps = Array.isArray(content?.steps) ? content.steps : null
  const badContent = content && (!steps || steps.length === 0)

  // Resume from saved step. Progress and content load independently, so keep
  // trying until the user navigates on their own.
  useEffect(() => {
    if (!steps || restoredRef.current) return
    if (savedStep > 0 && savedStep < steps.length && !isCompleted) {
      restoredRef.current = true
      setStepIndex(savedStep)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, savedStep])

  // Debounce progress writes (arrow-key holds fire many step changes),
  // flushing any pending save on unmount
  const scheduleSave = (i) => {
    saveRef.current.pending = i
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveRef.current.pending = null
      saveRef.current.onSaveStep(i)
    }, 800)
  }
  useEffect(() => () => {
    clearTimeout(saveTimerRef.current)
    const { pending, onSaveStep: save } = saveRef.current
    if (pending !== null) save(pending)
  }, [])

  const stepCount = steps?.length ?? 0
  const goTo = useCallback((i) => {
    if (i < 0 || i >= stepCount) return
    restoredRef.current = true
    setStepIndex(i)
    scheduleSave(i)
  }, [stepCount])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') goTo(stepIndex + 1)
      if (e.key === 'ArrowLeft') goTo(stepIndex - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stepIndex, goTo])

  if (error || badContent) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
        Could not load lesson content.
      </div>
    )
  }

  if (!steps) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
        Loading lesson...
      </div>
    )
  }

  // Clamp defensively: content re-published with fewer steps must not crash
  const current = Math.min(stepIndex, steps.length - 1)
  const isLast = current === steps.length - 1

  return (
    <div>
      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Step ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === current ? 'w-6 bg-blue-600' : i < current ? 'w-2 bg-blue-300' : 'w-2 bg-gray-200 hover:bg-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-400 ml-2">{current + 1} / {steps.length}</span>
      </div>

      {/* Current step — keyed so stateful steps (quizzes, widgets) reset per step */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4 min-h-64">
        <StepRenderer key={current} step={steps[current]} />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          &larr; Back
        </button>
        <span className="text-xs text-gray-400 hidden sm:inline">Tip: use &larr; &rarr; arrow keys</span>
        {isLast ? (
          isCompleted ? (
            <span className="px-4 py-2 text-sm text-green-600 font-medium">Completed ✓</span>
          ) : (
            <button
              onClick={onMarkComplete}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Mark Complete ✓
            </button>
          )
        ) : (
          <button
            onClick={() => goTo(current + 1)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Next &rarr;
          </button>
        )}
      </div>
    </div>
  )
}
