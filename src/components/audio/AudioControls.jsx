import { formatTime } from '../../lib/formatTime'

export default function AudioControls({ position, duration, playing, rate, onSeek, onToggle, onRate, disabled, message }) {
  const safePosition = Math.max(0, Math.min(duration || 0, position || 0))
  const seek = seconds => onSeek(Math.max(0, Math.min(duration, seconds)))
  return <div className="audio-controls">
    <div className="player-label"><span className="eyebrow">LISTEN & LEARN</span><span role="status">{message || (playing ? 'Now playing' : 'Ready when you are')}</span></div>
    <input type="range" min="0" max={duration || 0} step="0.1" value={safePosition}
      disabled={disabled || !duration} aria-label="Playback position"
      aria-valuetext={`${formatTime(safePosition)} of ${formatTime(duration)}`}
      onChange={event => seek(Number(event.target.value))}
      className="seek-slider" style={{ '--played': `${duration ? safePosition / duration * 100 : 0}%` }} />
    <div className="player-times"><span>{formatTime(safePosition)}</span><span>{formatTime(duration)}</span></div>
    <div className="player-buttons">
      <button className="skip-button" onClick={() => seek(safePosition - 15)} disabled={disabled || !duration} aria-label="Back 15 seconds">↶<span>15s</span></button>
      <button className="play-button" onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <span aria-hidden="true">Ⅱ</span> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" fill="currentColor" /></svg>}</button>
      <button className="skip-button" onClick={() => seek(safePosition + 30)} disabled={disabled || !duration} aria-label="Forward 30 seconds">↷<span>30s</span></button>
    </div>
    <div className="player-speed"><span>Playback speed</span><div>{[0.75, 1, 1.25, 1.5].map(value => <button key={value} onClick={() => onRate(value)} aria-pressed={rate === value}>{value}×</button>)}</div></div>
  </div>
}
