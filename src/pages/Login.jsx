import { useState } from 'react'
import { isNativeShell } from '../lib/nativeBridge'
import Brand from '../components/Brand'

export default function Login({ onEmailSignIn, onEmailSignUp, onGoogleSignIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    try {
      const { error, data } = isSignUp
        ? await onEmailSignUp(email, password)
        : await onEmailSignIn(email, password)
      if (error) setError(error.message)
      else if (isSignUp && !data?.session) setNotice('Check your email to confirm your account, then sign in.')
    } catch { setError('We couldn’t connect. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-content">
        <div className="login-brand"><Brand large /></div>
        <h1>{isSignUp ? 'Create an account' : 'Sign in'}</h1>
        <p className="login-subtitle">{isSignUp ? 'Save your courses and lesson progress.' : 'Continue your courses and lessons.'}</p>

        <form onSubmit={handleSubmit} className="login-form space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
          {notice && <p role="status" className="text-emerald-700 text-sm">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'One moment…' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          {/* Google refuses OAuth from an embedded webview
              (disallowed_useragent), so the shell is email/password only */}
          {!isNativeShell && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-400">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setError(null)
                  try { const { error } = await onGoogleSignIn(); if (error) setError(error.message) }
                  catch { setError('We couldn’t connect to Google. Please try again.') }
                }}
                className="w-full py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Continue with Google
              </button>
            </>
          )}

          <p className="text-center text-sm text-gray-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setNotice(null) }}
              className="text-blue-600 hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
