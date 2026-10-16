import { createRoot } from 'react-dom/client'
import ThemePicker from './ThemePicker'
import { fixture } from './supabase'
import '../../src/index.css'
import './themes.css'

const params = new URLSearchParams(location.search)
if (params.get('native') === '1') {
  window.__HS_SHELL__ = { version: 2 }
  window.ReactNativeWebView = { postMessage: raw => {
    const command = JSON.parse(raw)
    if (command.type === 'play') {
      setTimeout(() => window.__hsNativeEvent(JSON.stringify({ type: 'status', lessonId: command.lessonId, position: command.position, duration: 120, playing: true })), 30)
    }
    if (command.type === 'seek') {
      // Deliberately send an old tick before confirming the requested position.
      window.__hsNativeEvent(JSON.stringify({ type: 'status', lessonId: 'spanish-2', position: 20, duration: 120, playing: true }))
      setTimeout(() => window.__hsNativeEvent(JSON.stringify({ type: 'seeked', lessonId: 'spanish-2', seekId: command.seekId, position: command.seconds })), 300)
    }
  } }
}
fixture.setScenario(params.get('scenario') || 'normal')
fixture.hold(params.get('scenario') === 'loading')
// Load the app only after setting the native bridge flag.
const { default: MainApp } = await import('../../src/App')
createRoot(document.getElementById('root')).render(<MainApp />)
if (!params.has('embed') && !params.has('themes')) createRoot(document.getElementById('fixture-tools')).render(<div style={{ background: '#20392e', color: 'white', padding: '6px 14px', fontSize: 11 }}>
  LOCAL FIXTURE · <button onClick={() => fixture.hold(false)}>Release loading</button> · <button onClick={() => { fixture.setScenario('normal'); fixture.hold(false) }}>Repair backend</button>
</div>)

if (params.has('themes')) {
  document.documentElement.dataset.previewTheme = 'graphite'
  createRoot(document.getElementById('fixture-tools')).render(<ThemePicker />)
}
