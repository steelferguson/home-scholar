import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useProgress } from '../hooks/useProgress'
import ReactMarkdown from 'react-markdown'
import VisualLessonPlayer from '../components/visual/VisualLessonPlayer'
import QuizGame from '../components/game/QuizGame'

export default function Lesson({ user, onSignOut }) {
  const { slug, number } = useParams()
  const navigate = useNavigate()
  const lessonNum = parseInt(number)
  const [course, setCourse] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [allLessons, setAllLessons] = useState([])
  const [vocab, setVocab] = useState(null) // { url, text } — keyed to detect stale content
  const [playbackRate, setPlaybackRate] = useState(1)
  const audioRef = useRef(null)
  const saveTimerRef = useRef(null)
  const { progress, savePosition, markComplete } = useProgress(user.id)

  useEffect(() => {
    supabase.from('courses').select('*').eq('slug', slug).single().then(({ data }) => {
      setCourse(data)
      if (data) {
        supabase.from('lessons').select('*').eq('course_id', data.id).order('lesson_number')
          .then(({ data: lessons }) => {
            setAllLessons(lessons || [])
            const current = lessons?.find(l => l.lesson_number === lessonNum)
            setLesson(current || null)
          })
      }
    })
  }, [slug, lessonNum])

  // Load vocab
  useEffect(() => {
    if (!lesson?.vocab_url) return
    fetch(lesson.vocab_url)
      .then(r => r.ok ? r.text() : '')
      .then(text => setVocab({ url: lesson.vocab_url, text }))
      .catch(() => setVocab(null))
  }, [lesson?.vocab_url])

  // Resume from saved position
  useEffect(() => {
    if (!lesson || !audioRef.current) return
    const saved = progress[lesson.id]
    if (saved?.last_position_seconds && saved.status !== 'completed') {
      audioRef.current.currentTime = saved.last_position_seconds
    }
  }, [lesson, progress])

  // Auto-save position every 10 seconds during playback
  const handleTimeUpdate = useCallback(() => {
    if (!lesson || !audioRef.current) return
    if (saveTimerRef.current) return
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      if (audioRef.current && !audioRef.current.paused) {
        savePosition(lesson.id, audioRef.current.currentTime)
      }
    }, 10000)
  }, [lesson, savePosition])

  // Save position on pause
  const handlePause = useCallback(() => {
    if (!lesson || !audioRef.current) return
    savePosition(lesson.id, audioRef.current.currentTime)
  }, [lesson, savePosition])

  // Apply playback rate
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate
  }, [playbackRate])

  const handleMarkComplete = async () => {
    if (!lesson) return
    await markComplete(lesson.id)
  }

  const vocabContent = vocab && vocab.url === lesson?.vocab_url ? vocab.text : ''
  const prevLesson = allLessons.find(l => l.lesson_number === lessonNum - 1)
  const nextLesson = allLessons.find(l => l.lesson_number === lessonNum + 1)
  const isCompleted = lesson && progress[lesson.id]?.status === 'completed'

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  // Kids quiz-game lessons take over the whole screen with their own theme
  if (lesson.lesson_type === 'quiz_game') {
    return (
      <QuizGame
        user={user}
        lesson={lesson}
        onExit={() => navigate(`/course/${slug}`)}
        onComplete={() => markComplete(lesson.id)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/course/${slug}`} className="text-blue-600 hover:underline text-sm">
            &larr; {course?.title}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button onClick={onSignOut} className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Lesson {lesson.lesson_number}: {lesson.title}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {lesson.duration_minutes ? `${Math.round(lesson.duration_minutes)} minutes` : ''}
          {isCompleted && <span className="ml-2 text-green-600 font-medium">Completed</span>}
        </p>

        {/* Visual lesson: step-through player */}
        {lesson.lesson_type === 'visual' && (
          <div className="mb-6">
            <VisualLessonPlayer
              lesson={lesson}
              savedStep={progress[lesson.id]?.last_position_seconds || 0}
              isCompleted={isCompleted}
              onSaveStep={(i) => savePosition(lesson.id, i)}
              onMarkComplete={handleMarkComplete}
            />
          </div>
        )}

        {/* Audio Player */}
        {lesson.lesson_type !== 'visual' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <audio
            ref={audioRef}
            src={lesson.audio_url}
            controls
            onTimeUpdate={handleTimeUpdate}
            onPause={handlePause}
            className="w-full mb-3"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Speed:</span>
              {[0.75, 1, 1.25, 1.5].map(rate => (
                <button
                  key={rate}
                  onClick={() => setPlaybackRate(rate)}
                  className={`px-2 py-1 text-xs rounded ${
                    playbackRate === rate
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
            {!isCompleted && (
              <button
                onClick={handleMarkComplete}
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
              >
                Mark Complete
              </button>
            )}
          </div>
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
