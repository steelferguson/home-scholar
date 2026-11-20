import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { chicagoDate } from '../lib/wallet'
import { supabase } from '../supabaseClient'
import { useQuery, queryData } from '../hooks/useQuery'
import { useFamily } from '../hooks/useFamily'
import { useWallet } from '../hooks/useWallet'
import WalletCard from '../components/wallet/WalletCard'
import LoadState from '../components/LoadState'
import AppHeader from '../components/AppHeader'
import Lesson from './Lesson'
import Course from './Course'


const subjects = ['math-facts', 'spanish-kids-1']

export default function ChildPlan({ user }) {
  const { active } = useFamily()
  const wallet = useWallet()
  const { slug, number } = useParams()
  const [day, setDay] = useState(chicagoDate)
  useEffect(() => {
    const check = () => setDay(chicagoDate())
    const timer = setInterval(check, 15000)
    window.addEventListener('focus', check)
    return () => { clearInterval(timer); window.removeEventListener('focus', check) }
  }, [])
  const load = useCallback(() => queryData(supabase.rpc('daily_plan', { p_profile_id: active.id })), [active.id])
  const plan = useQuery([active.id, day, slug, number].join('/'), load)
  const steps = plan.data
  const next = steps?.find(step => !step.completed)
  const complete = steps?.length === 5 && !next
  if (slug && steps) {
    if (!subjects.includes(slug)) return <Navigate to="/" replace />
    if (!number) return complete ? <Course user={user} extraPractice /> : <Navigate to="/" replace />
    if (!complete && (next?.slug !== slug || next.lesson_number !== Number(number))) return <Navigate to="/" replace />
    const finish = async lessonId => {
      if (!next) return { cents: 0, extra: true }
      const [receipt] = await queryData(supabase.rpc('finish_daily_step', {
        p_profile_id: active.id, p_day: next.school_day, p_slot: next.slot, p_lesson_id: lessonId,
      }))
      void wallet.retry().catch(() => {})
      return receipt
    }
    return <Lesson key={steps[0].school_day + '/' + slug + '/' + number} user={user} finishPlan={finish} extraPractice={complete} />
  }
  return <div className="app-page"><AppHeader user={user} /><main className="dashboard-main">
    <h1>Today’s learning plan</h1>
    {plan.loading || plan.error ? <LoadState loading={plan.loading} message={plan.loading ? 'Loading your plan…' : 'Couldn’t load your daily plan.'} onRetry={plan.retry} /> : <>
      <ol className="lesson-list">{steps.map(step => <li className="lesson-row" key={step.slot}>
        <span className="lesson-number">{step.slot}</span>
        <div className="lesson-row-text"><h2>{step.slot < 5 ? 'Math Facts' : 'Spanish Quest'} · {step.title}</h2>
        {step.completed ? 'Complete' : step === next ? <Link className="primary-button" to={`/course/${step.slug}/lesson/${step.lesson_number}`}>Start</Link> : 'Up next'}</div>
      </li>)}</ol>
      {complete && <section className="state-card"><h2>Daily plan complete!</h2><p>Extra practice earns no more money today.</p>
        <Link className="quiet-button" to="/course/math-facts">Practice math</Link> <Link className="quiet-button" to="/course/spanish-kids-1">Practice Spanish</Link>
      </section>}
    </>}
    <WalletCard profile={active} />
  </main></div>
}
