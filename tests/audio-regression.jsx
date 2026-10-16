import { createRoot } from 'react-dom/client'
import WebAudioPlayer from '../src/components/audio/WebAudioPlayer'
import '../src/index.css'
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const until = async predicate => {
  for (let i = 0; i < 150; i++) { if (predicate()) return; await wait(20) }
  throw new Error('Expected player state was not reached')
}
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const results = document.getElementById('results')
document.getElementById('run').onclick = async event => {
  event.target.disabled = true
  const root = createRoot(document.getElementById('player'))
  let props = { lesson: { id: 'lesson-a', audio_url: '/tests/tone.wav' },
    savedPosition: 20, progressReady: false, completed: false,
    onSave: async () => {}, onComplete: async () => {} }
  const render = () => root.render(<WebAudioPlayer key={props.lesson.id} {...props} />)
  const report = name => { const li = document.createElement('li'); li.textContent = `PASS: ${name}`; results.append(li) }
  try {
    render()
    await until(() => document.querySelector('audio')?.readyState >= 1)
    let audio = document.querySelector('audio')
    assert(audio.currentTime === 0, 'Restored before progress was ready')
    props = { ...props, progressReady: true }; render()
    await until(() => Math.abs(audio.currentTime - 20) < 0.01)
    report('Restore waits for metadata and saved progress')
    document.querySelector('[aria-label="Forward 30 seconds"]').click()
    await until(() => Math.abs(audio.currentTime - 50) < 0.01)
    props = { ...props, savedPosition: 4 }; render()
    await wait(80)
    assert(Math.abs(audio.currentTime - 50) < 0.01, 'Saved progress snapped playback backwards')
    report('Late saved-position updates do not undo a user seek')
    document.querySelector('[aria-label="Forward 30 seconds"]').click()
    await until(() => Math.abs(audio.currentTime - 80) < 0.01)
    document.querySelector('[aria-label="Forward 30 seconds"]').click()
    await until(() => Math.abs(audio.currentTime - 110) < 0.01)
    props = { ...props, completed: true }; render()
    await wait(80)
    assert(Math.abs(audio.currentTime - 110) < 0.01, 'Marking complete changed playback position')
    report('Rapid skips and completion leave playback at the chosen position')
    props = { ...props, lesson: { id: 'lesson-b', audio_url: '/tests/tone.wav' }, savedPosition: 7, completed: false }; render()
    await until(() => document.querySelector('audio') !== audio && document.querySelector('audio').readyState >= 1)
    audio = document.querySelector('audio')
    await until(() => Math.abs(audio.currentTime - 7) < 0.01)
    report('A new lesson restores its own position')
    document.querySelector('[aria-label="Forward 30 seconds"]').click()
    await until(() => Math.abs(audio.currentTime - 37) < 0.01)
    const speed = [...document.querySelectorAll('.player-speed button')].find(button => button.textContent === '1.5×')
    speed.click()
    audio.dispatchEvent(new Event('error'))
    await until(() => [...document.querySelectorAll('button')].some(button => button.textContent === 'Retry audio'))
    ;[...document.querySelectorAll('button')].find(button => button.textContent === 'Retry audio').click()
    await until(() => audio.readyState >= 1)
    await wait(80)
    assert(Math.abs(audio.currentTime - 37) < 0.01, 'Retry lost the current playback position')
    assert(audio.playbackRate === 1.5, 'Retry lost the selected playback speed')
    report('Retry reloads real audio at the current position and selected speed')
    const li = document.createElement('li'); li.textContent = '5 passed, 0 failed'; results.append(li)
  } catch (error) {
    const li = document.createElement('li'); li.textContent = `FAIL: ${error.message}`; results.append(li)
  } finally { root.unmount() }
}
