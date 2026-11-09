import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useNativeAudioSync } from './hooks/useNativeAudioSync'
import { isNativeShell } from './lib/nativeBridge'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Course from './pages/Course'
import Lesson from './pages/Lesson'
import ProgressProvider from './components/ProgressProvider'
import Brand from './components/Brand'
import FamilyProvider from './components/family/FamilyProvider'
import PasswordSetup from './components/family/PasswordSetup'
import ParentPage from './components/family/ParentPage'
import { useFamily } from './hooks/useFamily'
import { stop } from './lib/playbackStore'

// Shell only: audio keeps playing after you leave the lesson page
const MiniPlayer = lazy(() => import('./components/audio/MiniPlayer'))

function NativeAudioSync({ userId }) {
  useNativeAudioSync(userId)
  return null
}

function FamilyApp({ user, signOut }) {
  const { active, loading, store } = useFamily()
  const handleSignOut = async () => {
    stop()
    const { error } = await signOut()
    if (error) throw new Error('Could not sign out. Please try again.')
    store.lock()
  }
  if (loading) return <p role="status">Loading your family…</p>
  return <BrowserRouter>
    {!active ? <ParentPage user={user} onSignOut={handleSignOut} /> :
      <ProgressProvider key={active.id} userId={user.id} profileId={active.id}>
        <NativeAudioSync userId={user.id} />
        <Routes>
          <Route path="/parent" element={<ParentPage user={user} onSignOut={handleSignOut} />} />
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/course/:slug" element={<Course user={user} />} />
          <Route path="/course/:slug/lesson/:number" element={<Lesson user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {isNativeShell && <Suspense fallback={null}><MiniPlayer /></Suspense>}
      </ProgressProvider>}
  </BrowserRouter>
}

export default function App() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, recoveryUserId, setRecoveryPassword, cancelRecovery } = useAuth()
  if (loading) return <div className="login-page" role="status"><Brand large /><p>Opening your learning space…</p></div>
  if (recoveryUserId) return <PasswordSetup onSave={setRecoveryPassword} onCancel={cancelRecovery} />
  if (!user) return <Login onEmailSignIn={signInWithEmail} onEmailSignUp={signUpWithEmail} onGoogleSignIn={signInWithGoogle} />
  return <FamilyProvider key={user.id} user={user}><FamilyApp user={user} signOut={signOut} /></FamilyProvider>
}
