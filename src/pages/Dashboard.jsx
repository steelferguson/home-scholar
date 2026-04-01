import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useProgress } from '../hooks/useProgress'

export default function Dashboard({ user, onSignOut }) {
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState({})
  const { progress } = useProgress(user.id)

  useEffect(() => {
    supabase.from('courses').select('*').order('sort_order').then(({ data }) => {
      setCourses(data || [])
    })
    supabase.from('lessons').select('id, course_id').then(({ data }) => {
      const map = {}
      for (const l of data || []) {
        if (!map[l.course_id]) map[l.course_id] = []
        map[l.course_id].push(l.id)
      }
      setLessons(map)
    })
  }, [])

  const getCourseProgress = (courseId) => {
    const lessonIds = lessons[courseId] || []
    if (lessonIds.length === 0) return { completed: 0, total: 0, pct: 0 }
    const completed = lessonIds.filter(id => progress[id]?.status === 'completed').length
    return { completed, total: lessonIds.length, pct: Math.round((completed / lessonIds.length) * 100) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Home Scholar</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button onClick={onSignOut} className="text-sm text-gray-400 hover:text-gray-600">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Courses</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => {
            const { completed, total, pct } = getCourseProgress(course.id)
            return (
              <Link
                key={course.id}
                to={`/course/${course.slug}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition block"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{course.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>{completed}/{total} lessons</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            )
          })}
        </div>

        {courses.length === 0 && (
          <p className="text-gray-400 text-center py-12">No courses available yet.</p>
        )}
      </main>
    </div>
  )
}
