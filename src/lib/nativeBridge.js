// Bridge to the Home Scholar native shell (projects/home-scholar-mobile).
//
// The shell wraps this same web app in a WebView and owns audio playback, so
// lessons keep playing with the screen off and get lock-screen controls. In a
// plain browser none of this is active and the app behaves exactly as before.

export const isNativeShell =
  typeof window !== 'undefined' && !!window.ReactNativeWebView && !!window.__HS_SHELL__

export function postToNative(message) {
  if (!isNativeShell) return
  window.ReactNativeWebView.postMessage(JSON.stringify(message))
}

const listeners = new Set()

// The shell calls this via injectJavaScript. Registered at import time so no
// status update is missed while a page is still mounting.
if (typeof window !== 'undefined') {
  window.__hsNativeEvent = (raw) => {
    let message
    try {
      message = JSON.parse(raw)
    } catch {
      return
    }
    for (const fn of listeners) fn(message)
  }
}

export function onNativeEvent(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
