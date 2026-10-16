import { useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useProgress } from '../hooks/useProgress'
import { useQuery, queryData } from '../hooks/useQuery'
import AppHeader from '../components/AppHeader'
import LoadState from '../components/LoadState'

export default function Course({ user, onSignOut }) {
  const { slug } = useParams()
  const saved = useProgress()
  const load = useCallback(async () => {
    const course = await queryData(supabase.from('courses').select('*').eq('slug', slug).maybeSingle())
    if (!course) return null
    const lessons = await queryData(supabase.from('lessons').select('*').eq('course_id', course.id).order('lesson_number'))
    return { course, lessons: lessons || [] }
  }, [slug])
  const { data, loading, error, retry } = useQuery(slug, load)
  const completed = data?.lessons.filter(lesson => saved.progress[lesson.id]?.status === 'completed').length || 0
  const next = data?.lessons.find(lesson => saved.progress[lesson.id]?.status !== 'completed')
  return <div className="app-page">
    <AppHeader user={user} onSignOut={onSignOut} backTo="/" backLabel="All courses" />
    <main className="lesson-main">
      {loading ? <LoadState loading message="Loading your lessons…" />
        : error ? <LoadState message="We couldn’t load this course." onRetry={retry} backTo="/" />
        : !data ? <LoadState message="This course could not be found." backTo="/" />
        : <>
          <div className="page-intro"><h1>{data.course.title}</h1><p>{data.course.description}</p></div>
          {saved.error && <div className="inline-notice" role="alert">{saved.error} <button onClick={saved.retry}>Try again</button></div>}
          <div className="course-summary"><span>{saved.loading ? 'Loading progress…' : saved.error ? 'Progress unavailable' : `${completed} of ${data.lessons.length} complete`}</span>
            {next && !saved.loading && !saved.error && <Link className="primary-button" to={`/course/${slug}/lesson/${next.lesson_number}`}>{completed || saved.progress[next.id] ? 'Continue' : 'Start learning'} →</Link>}
          </div>
          {data.lessons.length === 0 ? <div className="state-card"><p>Lessons are on their way. Check back soon.</p></div> :
            <div className="lesson-list">{data.lessons.map(lesson => {
              const status = saved.progress[lesson.id]?.status
              return <Link key={lesson.id} to={`/course/${slug}/lesson/${lesson.lesson_number}`} className="lesson-row">
                <span className={`lesson-number ${status === 'completed' ? 'is-complete' : ''}`}>{status === 'completed' ? '✓' : String(lesson.lesson_number).padStart(2, '0')}</span>
                <div className="lesson-row-text"><h2>{lesson.title}</h2><span>{lesson.lesson_type === 'visual' ? 'Interactive lesson' : lesson.lesson_type === 'quiz_game' ? 'Quiz & play' : 'Audio lesson'}{status === 'in_progress' ? ' · In progress' : status === 'completed' ? ' · Completed' : ''}</span></div>
                <span className="lesson-duration">{lesson.duration_minutes ? `${Math.round(lesson.duration_minutes)} min` : ''}</span><span aria-hidden="true">→</span>
              </Link>
            })}</div>}
        </>}
    </main>
  </div>
}
