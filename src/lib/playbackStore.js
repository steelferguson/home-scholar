import { onNativeEvent, postToNative } from './nativeBridge.js'

// Shared "what is playing right now" state for the native shell.
//
// Audio outlives the lesson page, so playback state can't live in it. The
// lesson player and the persistent mini player both read from here.

let state = {
  active: false, // something is loaded, even if paused
  lessonId: null,
  title: '',
  courseTitle: '',
  courseSlug: '',
  lessonNumber: null,
  position: 0,
  duration: 0,
  playing: false,
  rate: 1,
  buffering: false,
  seeking: false,
  error: null,
}

const subscribers = new Set()
let pendingSeek = null
let seekSequence = 0

function set(changes) {
  state = { ...state, ...changes }
  for (const fn of subscribers) fn()
}

export function subscribe(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export function getSnapshot() {
  return state
}

export function play({ lesson, courseTitle, courseSlug, position = 0 }) {
  pendingSeek = null
  const resuming = state.active && state.lessonId === lesson.id
  set({
    active: true,
    buffering: true,
    seeking: false,
    error: null,
    playing: true,
    lessonId: lesson.id,
    title: lesson.title,
    courseTitle,
    courseSlug,
    lessonNumber: lesson.lesson_number,
    position: resuming ? state.position : position,
    duration: lesson.duration_minutes ? lesson.duration_minutes * 60 : 0,
  })
  postToNative({
    type: 'play',
    lessonId: lesson.id,
    url: lesson.audio_url,
    title: lesson.title,
    subtitle: courseTitle,
    position,
    rate: state.rate,
  })
}

export function pause() {
  set({ playing: false })
  postToNative({ type: 'pause' })
}

export function resume() {
  set({ playing: true, ...(state.duration && state.position >= state.duration ? { position: 0 } : {}) })
  postToNative({ type: 'resume' })
}

export function seek(seconds) {
  if (!state.active || !Number.isFinite(seconds)) return
  const position = Math.max(0, Math.min(state.duration || Infinity, seconds))
  pendingSeek = { position, from: state.position, id: ++seekSequence, started: Date.now() }
  set({ position, error: null, seeking: true })
  postToNative({ type: 'seek', seconds: position, seekId: pendingSeek.id })
}

export function setRate(rate) {
  set({ rate })
  postToNative({ type: 'rate', rate })
}

export function stop() {
  pendingSeek = null
  set({ active: false, playing: false, lessonId: null, position: 0, seeking: false, error: null })
  postToNative({ type: 'stop' })
}

// Native is the source of truth once playing; ignore anything about a lesson
// we're no longer tracking
onNativeEvent((message) => {
  if (!state.lessonId || message.lessonId !== state.lessonId) return

  if (message.type === 'error') {
    pendingSeek = null
    set({ playing: false, buffering: false, seeking: false, error: 'Audio could not play. Press play to try again.' })
    return
  }
  if (message.type === 'seeked') {
    if (pendingSeek && message.seekId !== pendingSeek.id) return
    if (message.seekId && message.seekId < seekSequence) return
    pendingSeek = null
    set({ position: message.position, error: null, seeking: false, buffering: false })
    return
  }
  if (pendingSeek && (message.type === 'status' || message.type === 'paused' || message.type === 'ended')) {
    const acknowledgedShell = Number(globalThis.window?.__HS_SHELL__?.version) >= 2
    const reachedTarget = Number.isFinite(message.position)
      && message.position >= pendingSeek.position - 0.05
      && message.position <= pendingSeek.position + Math.max(2, state.rate * 3)
      && (pendingSeek.position >= pendingSeek.from ? message.position > pendingSeek.from : message.position < pendingSeek.from)
    if (!acknowledgedShell && reachedTarget) {
      set({ seeking: false })
      pendingSeek = null // Compatible with an installed shell predating seek acknowledgements.
    } else if (Date.now() - pendingSeek.started < 5000) {
      return
    } else {
      pendingSeek = null
      set({ seeking: false, error: 'The audio could not move to that spot. Please try again.' })
    }
  }
  if (message.type === 'ended') {
    set({ playing: false, position: state.duration, buffering: false })
  } else if (message.type === 'playing') {
    set({ playing: true })
  } else if (message.type === 'paused') {
    set({ playing: false, position: message.position })
  } else if (message.type === 'status') {
    set({
      playing: message.playing,
      buffering: Boolean(message.buffering),
      position: message.position,
      duration: message.duration > 0 ? message.duration : state.duration,
    })
  }
})
