// Big on-screen 0-9 keypad: no iPad system keyboard, no multiple choice.
const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']
export default function Keypad({ value, disabled, onChange, onSubmit }) {
  const press = key => {
    if (key === '⌫') onChange(value.slice(0, -1))
    else if (key === '✓') onSubmit()
    else if (value.length < 2) onChange(value + key)
  }
  return <div className="grid grid-cols-3 gap-3 w-full max-w-sm" role="group" aria-label="Number keypad">
    {keys.map(key => <button key={key} type="button" disabled={disabled || (key === '✓' && value === '')} onClick={() => press(key)}
      aria-label={key === '⌫' ? 'Delete' : key === '✓' ? 'Check answer' : key}
      className={`h-20 rounded-2xl text-4xl font-extrabold shadow-md active:translate-y-0.5 disabled:opacity-40 ${key === '✓' ? 'bg-yellow-300 text-teal-900' : 'bg-white text-teal-900'}`}>{key}</button>)}
  </div>
}
