export default function RewardBar({ coins, streak, onExit }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={onExit}
        className="bg-white/20 hover:bg-white/30 text-white rounded-full w-10 h-10 text-xl font-bold"
        aria-label="Exit"
      >
        ✕
      </button>
      <div className="flex items-center gap-3">
        {streak > 0 && (
          <span className="bg-white/20 text-white rounded-full px-4 py-1.5 text-lg font-bold">
            🔥 {streak}
          </span>
        )}
        <span className="bg-yellow-400 text-yellow-900 rounded-full px-4 py-1.5 text-lg font-bold shadow">
          🪙 {coins}
        </span>
      </div>
    </div>
  )
}
