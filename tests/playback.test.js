import test from 'node:test'
import assert from 'node:assert/strict'

globalThis.window = { ReactNativeWebView: { postMessage: () => {} }, __HS_SHELL__: 1 }
const playback = await import('../src/lib/playbackStore.js')
const emit = event => window.__hsNativeEvent(JSON.stringify({ lessonId: 'lesson', ...event }))
const start = () => {
  playback.stop()
  playback.play({ lesson: { id: 'lesson', title: 'A lesson', lesson_number: 1, duration_minutes: 10 }, courseSlug: 'course' })
  emit({ type: 'status', position: 20, duration: 600, playing: true })
}
test('an old native tick does not snap the slider back after seeking', () => {
  start()
  playback.seek(120)
  emit({ type: 'status', position: 21, duration: 600, playing: true })
  assert.equal(playback.getSnapshot().position, 120)
  emit({ type: 'status', position: 120, duration: 600, playing: true })
  emit({ type: 'status', position: 122, duration: 600, playing: true })
  assert.equal(playback.getSnapshot().position, 122)
})
test('rapid seeks ignore the acknowledgement for an earlier seek', () => {
  start()
  const messages = []
  window.ReactNativeWebView.postMessage = raw => messages.push(JSON.parse(raw))
  playback.seek(90)
  playback.seek(180)
  emit({ type: 'seeked', position: 90, seekId: messages[0].seekId })
  emit({ type: 'status', position: 90, duration: 600, playing: true })
  assert.equal(playback.getSnapshot().position, 180)
  emit({ type: 'seeked', position: 180, seekId: messages[1].seekId })
  assert.equal(playback.getSnapshot().position, 180)
})
test('native errors leave a retry message instead of a false playing state', () => {
  start()
  emit({ type: 'error' })
  assert.equal(playback.getSnapshot().playing, false)
  assert.ok(playback.getSnapshot().error)
})
test('a small legacy seek is not confirmed by a tick at the old position', () => {
  window.__HS_SHELL__ = { version: 1 }
  start()
  playback.seek(21)
  emit({ type: 'status', position: 20, duration: 600, playing: false })
  assert.equal(playback.getSnapshot().position, 21)
  emit({ type: 'status', position: 21, duration: 600, playing: false })
  assert.equal(playback.getSnapshot().seeking, false)
})
test('updated shells wait for the matching seek acknowledgement', () => {
  window.__HS_SHELL__ = { version: 2 }
  start()
  const messages = []
  window.ReactNativeWebView.postMessage = raw => messages.push(JSON.parse(raw))
  playback.seek(21)
  emit({ type: 'status', position: 22, duration: 600, playing: true })
  assert.equal(playback.getSnapshot().position, 21)
  assert.equal(playback.getSnapshot().seeking, true)
  emit({ type: 'seeked', position: 21, seekId: messages[0].seekId })
  assert.equal(playback.getSnapshot().seeking, false)
})
