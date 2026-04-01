import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useProgress } from '../hooks/useProgress'

export default function Course({ user, onSignOut }) {
  const { slug } = useParams()
  const [course, setCourse] = useState(null)
  const [lessonList, setLessonList] = useState([])
  const { progress } = useProgress(user.id)

  useEffect(() => {
    supabase.from('courses').select('*').eq('slug', slug).single().then(({ data }) => {
      setCourse(data)
      if (data) {
        supabase.from('lessons').select('*').eq('course_id', data.id).order('lesson_number')
          .then(({ data: lessons }) => setLessonList(lessons || []))
      }
    })
  }, [slug])

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const statusIcon = (lessonId) => {
    const p = progress[lessonId]
    if (!p || p.status === 'not_started') return <span className="text-gray-300">&#9675;</span>
    if (p.status === 'in_progress') return <span className="text-blue-500">&#9684;</span>
    return <span className="text-green-500">&#9679;</span>
  }

  const nextLesson = lessonList.find(l => {
    const p = progress[l.id]
    return !p || p.status !== 'completed'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-blue-600 hover:underline text-sm">&larr; Courses</Link>
          <h1 className="text-xl font-bold text-gray-900">Home Scholar</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button onClick={onSignOut} className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h2>
        <p className="text-gray-500 mb-6">{course.description}</p>

        {nextLesson && (
          <Link
            to={`/course/${slug}/lesson/${nextLesson.lesson_number}`}
            className="inline-block mb-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Continue &rarr; Lesson {nextLesson.lesson_number}
          </Link>
        )}

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {lessonList.map(lesson => (
            <Link
              key={lesson.id}
              to={`/course/${slug}/lesson/${lesson.lesson_number}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition"
            >
              <span className="text-lg">{statusIcon(lesson.id)}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900">
                  Lesson {lesson.lesson_number}
                </span>
                <span className="text-sm text-gray-500 ml-2">{lesson.title}</span>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {lesson.duration_minutes ? `${Math.round(lesson.duration_minutes)} min` : ''}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
