import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useProgress } from '../hooks/useProgress'
import { useQuery, queryData } from '../hooks/useQuery'
import AppHeader from '../components/AppHeader'
import LoadState from '../components/LoadState'

export default function Dashboard({ user, onSignOut }) {
  const saved = useProgress()
  const load = useCallback(async () => {
    const [courses, lessons] = await Promise.all([
      queryData(supabase.from('courses').select('*').order('sort_order')),
      queryData(supabase.from('lessons').select('id, course_id, lesson_type')),
    ])
    return { courses: courses || [], lessons: lessons || [] }
  }, [])
  const { data, loading, error, retry } = useQuery('courses', load)
  return (
    <div className="app-page">
      <AppHeader user={user} onSignOut={onSignOut} />
      <main className="dashboard-main">
        <div className="dashboard-heading">
          <h1>Your courses</h1>
          {data && <span>{data.courses.length} courses</span>}
        </div>
        {loading ? <LoadState loading message="Loading your courses…" />
          : error ? <LoadState message="We couldn’t load your courses." onRetry={retry} />
          : data.courses.length === 0 ? <div className="state-card"><p>No courses are available yet.</p></div>
          : <>
            {saved.error && <div className="inline-notice" role="alert">{saved.error} <button onClick={saved.retry}>Try again</button></div>}
            <div className="course-table-heading" aria-hidden="true">
              <span>Course</span><span>Format</span><span>Progress</span>
            </div>
            <div className="course-rows">
              {data.courses.map((course, index) => {
                const lessons = data.lessons.filter(lesson => lesson.course_id === course.id)
                const completed = lessons.filter(lesson => saved.progress[lesson.id]?.status === 'completed').length
                const pct = lessons.length ? Math.round(completed / lessons.length * 100) : 0
                const audio = lessons.some(lesson => !lesson.lesson_type || lesson.lesson_type === 'audio')
                const kids = course.audience === 'kids'
                return <Link key={course.id} to={`/course/${course.slug}`} className={`course-button course-tone-${index % 4}`}>
                  <div className="course-info">
                    <h2>{course.title}</h2>
                    <p>{course.description}</p>
                  </div>
                  <span className="course-format">{kids ? 'Kids' : audio ? 'Audio' : 'Interactive'}</span>
                  <div className="course-progress-cell">
                    <div className="course-progress-label">
                      <span>{saved.loading ? 'Loading progress…' : saved.error ? 'Progress unavailable' : `${completed} / ${lessons.length} complete`}</span>
                      <strong>{!saved.loading && !saved.error ? `${pct}%` : '—'}</strong>
                    </div>
                    <div className="course-progress" role="progressbar" aria-label={`${course.title} completion`} aria-valuenow={!saved.loading && !saved.error ? pct : undefined} aria-valuemin={0} aria-valuemax={100}>
                      <span style={{ width: `${!saved.loading && !saved.error ? pct : 0}%` }} />
                    </div>
                  </div>
                </Link>
              })}
            </div>
          </>}
      </main>
    </div>
  )
}
