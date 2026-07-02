// Spanish audio for quiz prompts. Prefers a pre-generated MP3 (from the same
// TTS pipeline that builds the audio lessons) when the question provides one;
// falls back to the browser's built-in speech synthesis.
let currentAudio = null

export function canSpeak() {
  return typeof window !== 'undefined' && !!window.speechSynthesis
}

export function speakSpanish(text, audioUrl) {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if (audioUrl) {
    const audio = new Audio(audioUrl)
    currentAudio = audio
    // Only fall back if this audio is still the active one — pausing it from
    // a newer speak call rejects play(), and that must not resurrect old text
    audio.play().catch(() => {
      if (currentAudio === audio) speakWithSynthesis(text)
    })
    return
  }
  speakWithSynthesis(text)
}

function speakWithSynthesis(text) {
  if (!window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'es-ES'
  utterance.rate = 0.8
  const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('es'))
  if (voice) utterance.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
