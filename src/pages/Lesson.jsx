import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useProgress } from '../hooks/useProgress'
import { isNativeShell } from '../lib/nativeBridge'
import ReactMarkdown from 'react-markdown'
import AppHeader from '../components/AppHeader'
import LoadState from '../components/LoadState'
import WebAudioPlayer from '../components/audio/WebAudioPlayer'
import { useQuery, queryData } from '../hooks/useQuery'

// Both players pull heavy deps (KaTeX, confetti) — keep them out of the main chunk
const VisualLessonPlayer = lazy(() => import('../components/visual/VisualLessonPlayer'))
const QuizGame = lazy(() => import('../components/game/QuizGame'))
const NativeAudioPlayer = lazy(() => import('../components/audio/NativeAudioPlayer'))

const loadingCard = (
  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
    Loading lesson...
  </div>
)

export default function Lesson({ user, onSignOut }) {
  const { slug, number } = useParams()
  const navigate = useNavigate()
  const lessonNum = Number(number)
  const [vocab, setVocab] = useState(null)
  const [saving, setSaving] = useState(false)
  const saved = useProgress()
  const { progress, savePosition, markComplete } = saved
  const load = useCallback(async () => {
    const course = await queryData(supabase.from('courses').select('*').eq('slug', slug).maybeSingle())
    if (!course) return null
    const allLessons = await queryData(supabase.from('lessons').select('*').eq('course_id', course.id).order('lesson_number'))
    return { course, allLessons: allLessons || [], lesson: allLessons?.find(item => item.lesson_number === lessonNum) }
  }, [slug, lessonNum])
  const { data, loading, error, retry } = useQuery(`${slug}/${number}`, load)
  const { course, lesson, allLessons = [] } = data || {}

  // Load vocab; the stale flag stops a slow response for a previous lesson
  // from clobbering the current one
  useEffect(() => {
    if (!lesson?.vocab_url) return
    let stale = false
    fetch(lesson.vocab_url)
      .then(r => r.ok ? r.text() : '')
      .then(text => { if (!stale) setVocab({ url: lesson.vocab_url, text }) })
      .catch(() => {})
    return () => { stale = true }
  }, [lesson?.vocab_url])

  const handleMarkComplete = async () => {
    if (!lesson || saving) return
    setSaving(true)
    try { await markComplete(lesson.id) } catch { /* Shared progress notice displays the failure. */ }
    finally { setSaving(false) }
  }

  const vocabContent = vocab && vocab.url === lesson?.vocab_url ? vocab.text : ''
  const prevLesson = allLessons.find(l => l.lesson_number === lessonNum - 1)
  const nextLesson = allLessons.find(l => l.lesson_number === lessonNum + 1)
  const isCompleted = lesson && progress[lesson.id]?.status === 'completed'

  if (loading || error || !lesson) {
    return <div className="app-page">
      <AppHeader user={user} onSignOut={onSignOut} backTo="/" backLabel="All courses" />
      <main className="lesson-main"><LoadState loading={loading}
        message={loading ? 'Loading your lesson…' : error ? 'We couldn’t load this lesson.' : 'This lesson could not be found.'}
        onRetry={error ? retry : undefined} backTo="/" /></main>
    </div>
  }

  // Kids quiz-game lessons take over the whole screen with their own theme.
  // Keyed by lesson id so game state never leaks between lessons.
  if (lesson.lesson_type === 'quiz_game') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600 flex items-center justify-center">
          <div className="text-white text-3xl animate-bounce">🎈 Loading...</div>
        </div>
      }>
        <QuizGame
          key={lesson.id}
          user={user}
          lesson={lesson}
          onExit={() => navigate(`/course/${slug}`)}
          onComplete={handleMarkComplete}
        />
      </Suspense>
    )
  }

  return (
    <div className="app-page">
      <AppHeader user={user} onSignOut={onSignOut} backTo={`/course/${slug}`} backLabel={course.title} />
      <main className="lesson-main">
        <p className="eyebrow mb-3">LESSON {lesson.lesson_number}</p>
        {saved.error && <div className="inline-notice" role="alert">{saved.error} <button onClick={saved.retry}>Try again</button></div>}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {lesson.title}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {lesson.duration_minutes ? `${Math.round(lesson.duration_minutes)} minutes` : ''}
          {isCompleted && <span className="ml-2 text-green-600 font-medium">Completed</span>}
        </p>

        {/* Visual lesson: step-through player, keyed so step state resets per lesson */}
        {lesson.lesson_type === 'visual' && (
          <div className="mb-6">
            <Suspense fallback={loadingCard}>
              <VisualLessonPlayer
                key={lesson.id}
                lesson={lesson}
                savedStep={progress[lesson.id]?.last_position_seconds || 0}
                isCompleted={isCompleted}
                onSaveStep={(i) => { if (!isCompleted) savePosition(lesson.id, i).catch(() => {}) }}
                onMarkComplete={handleMarkComplete}
              />
            </Suspense>
          </div>
        )}

        {/* Audio Player. In the native shell the shell owns playback (so it
            survives the screen locking) and this is only the controls. */}
        {lesson.lesson_type !== 'visual' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          {isNativeShell ? (
            <Suspense fallback={<div className="py-6 text-center text-gray-400">Loading player...</div>}>
              <NativeAudioPlayer
                key={lesson.id}
                lesson={lesson}
                courseTitle={course?.title}
                courseSlug={slug}
                savedPosition={isCompleted ? 0 : (progress[lesson.id]?.last_position_seconds || 0)}
              />
            </Suspense>
          ) : (
            <WebAudioPlayer key={lesson.id} lesson={lesson}
              savedPosition={progress[lesson.id]?.last_position_seconds || 0}
              progressReady={!saved.loading && !saved.error} completed={isCompleted}
              onSave={savePosition} onComplete={handleMarkComplete} />
          )}
          {!isCompleted && (
            <div className="flex justify-end mt-4">
              <button
                onClick={handleMarkComplete}
                disabled={saving}
                className="primary-button"
              >
                {saving ? 'Saving…' : 'Mark complete'}
              </button>
            </div>
          )}
        </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mb-8">
          {prevLesson ? (
            <Link
              to={`/course/${slug}/lesson/${prevLesson.lesson_number}`}
              className="text-sm text-blue-600 hover:underline"
            >
              &larr; Lesson {prevLesson.lesson_number}
            </Link>
          ) : <span />}
          {nextLesson ? (
            <Link
              to={`/course/${slug}/lesson/${nextLesson.lesson_number}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Lesson {nextLesson.lesson_number} &rarr;
            </Link>
          ) : <span />}
        </div>

        {/* Vocabulary */}
        {vocabContent && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Vocabulary</h3>
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{vocabContent}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
