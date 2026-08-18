import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useNativeAudioSync } from './hooks/useNativeAudioSync'
import { isNativeShell } from './lib/nativeBridge'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Course from './pages/Course'
import Lesson from './pages/Lesson'

// Shell only: audio keeps playing after you leave the lesson page
const MiniPlayer = lazy(() => import('./components/audio/MiniPlayer'))

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" />
  return children
}

export default function App() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth()

  // Native shell only: audio outlives the lesson page, so progress is saved here
  useNativeAudioSync(user?.id)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    )
  }

  return (
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
              <Dashboard user={user} onSignOut={signOut} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course/:slug"
          element={
            <ProtectedRoute user={user}>
              <Course user={user} onSignOut={signOut} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course/:slug/lesson/:number"
          element={
            <ProtectedRoute user={user}>
              <Lesson user={user} onSignOut={signOut} />
            </ProtectedRoute>
          }
        />
      </Routes>
      {isNativeShell && user && (
        <Suspense fallback={null}>
          <MiniPlayer />
        </Suspense>
      )}
    </BrowserRouter>
  )
}
