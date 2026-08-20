import { onNativeEvent, postToNative } from './nativeBridge'

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
}

const subscribers = new Set()

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
  const resuming = state.active && state.lessonId === lesson.id
  set({
    active: true,
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
  set({ playing: true })
  postToNative({ type: 'resume' })
}

export function seek(seconds) {
  set({ position: seconds })
  postToNative({ type: 'seek', seconds })
}

export function setRate(rate) {
  set({ rate })
  postToNative({ type: 'rate', rate })
}

export function stop() {
  set({ active: false, playing: false, lessonId: null, position: 0 })
  postToNative({ type: 'stop' })
}

// Native is the source of truth once playing; ignore anything about a lesson
// we're no longer tracking
onNativeEvent((message) => {
  if (!state.lessonId || message.lessonId !== state.lessonId) return

  if (message.type === 'ended') {
    set({ playing: false, position: state.duration })
  } else if (message.type === 'playing') {
    set({ playing: true })
  } else if (message.type === 'paused') {
    set({ playing: false, position: message.position })
  } else if (message.type === 'status') {
    set({
      playing: message.playing,
      position: message.position,
      duration: message.duration > 0 ? message.duration : state.duration,
    })
  }
})
