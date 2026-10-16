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
import { stop } from './lib/playbackStore'

// Shell only: audio keeps playing after you leave the lesson page
const MiniPlayer = lazy(() => import('./components/audio/MiniPlayer'))

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" />
  return children
}

function NativeAudioSync({ userId }) {
  useNativeAudioSync(userId)
  return null
}

export default function App() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth()

  const handleSignOut = () => { stop(); signOut() }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div role="status" className="text-center"><Brand large /><p className="mt-4">Opening your learning space…</p></div>
      </div>
    )
  }

  return (
    <ProgressProvider key={user?.id || "signed-out"} userId={user?.id}>
      <NativeAudioSync userId={user?.id} />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              user ? <Navigate to="/" /> :
              <Login
                onEmailSignIn={signInWithEmail}
                onEmailSignUp={signUpWithEmail}
                onGoogleSignIn={signInWithGoogle}
              />
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute user={user}>
                <Dashboard user={user} onSignOut={handleSignOut} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:slug"
            element={
              <ProtectedRoute user={user}>
                <Course user={user} onSignOut={handleSignOut} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:slug/lesson/:number"
            element={
              <ProtectedRoute user={user}>
                <Lesson user={user} onSignOut={handleSignOut} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {isNativeShell && user && (
          <Suspense fallback={null}>
            <MiniPlayer />
          </Suspense>
        )}
      </BrowserRouter>
    </ProgressProvider>
  )
}
