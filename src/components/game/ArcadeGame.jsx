import { useState, useEffect, useRef } from 'react'
import kaplay from 'kaplay'
import { speakSpanish } from '../../lib/speech'

const GAME_W = 800
const GAME_H = 450
const WORLD_W = 4200
const GROUND_Y = 400

// Timed 2D platformer reward round. Collectible coins carry the lesson's
// Spanish words — grabbing one says the word out loud.
export default function ArcadeGame({ words, seconds, onEnd }) {
  const canvasRef = useRef(null)
  const controlsRef = useRef({ left: false, right: false })
  const gameRef = useRef(null)
  const [score, setScore] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [lastWord, setLastWord] = useState(null)
  const [over, setOver] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (over) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setOver(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [over])

  useEffect(() => {
    if (hearts <= 0) setOver(true)
  }, [hearts])

  // Build the game world once
  useEffect(() => {
    const k = kaplay({
      canvas: canvasRef.current,
      width: GAME_W,
      height: GAME_H,
      background: [125, 211, 252],
      letterbox: true,
      global: false,
      pixelDensity: 1,
    })
    gameRef.current = k
    k.setGravity(1700)

    // --- Ground with gaps ---
    const gaps = [[900, 1020], [1700, 1850], [2600, 2740], [3400, 3520]]
    let x = 0
    for (const [gapStart, gapEnd] of gaps.concat([[WORLD_W, WORLD_W]])) {
      if (gapStart > x) {
        k.add([
          k.rect(gapStart - x, GAME_H - GROUND_Y),
          k.pos(x, GROUND_Y),
          k.color(74, 222, 128),
          k.area(),
          k.body({ isStatic: true }),
          'ground',
        ])
      }
      x = gapEnd
    }

    // --- Floating platforms ---
    const platforms = [
      [450, 300, 130], [700, 240, 120], [960, 300, 120], [1250, 260, 140],
      [1550, 310, 120], [1760, 230, 130], [2050, 290, 140], [2350, 240, 120],
      [2650, 300, 130], [2950, 250, 140], [3250, 310, 120], [3450, 240, 130],
      [3750, 290, 140],
    ]
    for (const [px, py, w] of platforms) {
      k.add([
        k.rect(w, 18, { radius: 6 }),
        k.pos(px, py),
        k.color(163, 98, 46),
        k.area(),
        k.body({ isStatic: true }),
        'ground',
      ])
    }

    // --- Word coins: on the ground path and on platforms ---
    const wordList = words.length ? words : [{ es: '¡hola!' }]
    let wordIdx = 0
    const addCoin = (cx, cy) => {
      const word = wordList[wordIdx % wordList.length].es
      wordIdx++
      const coin = k.add([
        k.circle(14),
        k.pos(cx, cy),
        k.color(250, 204, 21),
        k.outline(3, k.rgb(202, 138, 4)),
        k.area(),
        k.anchor('center'),
        'coin',
        { word },
      ])
      coin.add([
        k.text(word, { size: 13 }),
        k.pos(0, -30),
        k.anchor('center'),
        k.color(30, 41, 59),
      ])
    }
    for (const [px, py, w] of platforms) addCoin(px + w / 2, py - 40)
    for (let cx = 300; cx < WORLD_W - 200; cx += 380) addCoin(cx, GROUND_Y - 40)

    // --- Spikes ---
    for (const sx of [620, 1350, 2150, 2870, 3650]) {
      k.add([
        k.rect(34, 22, { radius: 4 }),
        k.pos(sx, GROUND_Y - 22),
        k.color(239, 68, 68),
        k.outline(2, k.rgb(153, 27, 27)),
        k.area(),
        'spike',
      ])
    }

    // --- Goal flag ---
    k.add([
      k.rect(14, 90),
      k.pos(WORLD_W - 120, GROUND_Y - 90),
      k.color(255, 255, 255),
      k.area(),
      'flag',
    ])
    k.add([
      k.rect(46, 30),
      k.pos(WORLD_W - 106, GROUND_Y - 90),
      k.color(234, 88, 12),
    ])

    // --- Player ---
    const spawn = () => k.vec2(60, GROUND_Y - 80)
    const player = k.add([
      k.rect(30, 38, { radius: 8 }),
      k.pos(spawn()),
      k.color(79, 70, 229),
      k.outline(3, k.rgb(49, 46, 129)),
      k.area(),
      k.body(),
      k.anchor('center'),
      'player',
    ])
    player.add([k.circle(4), k.pos(7, -8), k.color(255, 255, 255), k.anchor('center')])

    const SPEED = 260
    const JUMP = 640

    const tryJump = () => { if (player.isGrounded()) player.jump(JUMP) }
    k.onKeyPress('space', tryJump)
    k.onKeyPress('up', tryJump)
    k.onKeyPress('w', tryJump)
    controlsRef.current.jump = tryJump

    const hurt = () => {
      setHearts(h => h - 1)
      player.pos = spawn()
      player.vel = k.vec2(0, 0)
    }

    k.onUpdate(() => {
      const c = controlsRef.current
      if (k.isKeyDown('left') || k.isKeyDown('a') || c.left) player.move(-SPEED, 0)
      if (k.isKeyDown('right') || k.isKeyDown('d') || c.right) player.move(SPEED, 0)
      // Keep inside the world
      if (player.pos.x < 20) player.pos.x = 20
      if (player.pos.x > WORLD_W - 20) player.pos.x = WORLD_W - 20
      // Fell into a gap
      if (player.pos.y > GAME_H + 60) hurt()
      // Camera follows
      k.camPos(
        Math.max(GAME_W / 2, Math.min(player.pos.x, WORLD_W - GAME_W / 2)),
        GAME_H / 2,
      )
    })

    player.onCollide('coin', (coin) => {
      k.destroy(coin)
      setScore(s => s + 1)
      setLastWord(coin.word)
      speakSpanish(coin.word)
    })

    player.onCollide('spike', hurt)

    player.onCollide('flag', () => {
      setScore(s => s + 5)
      setLastWord('¡META! +5')
      player.pos = spawn()
    })

    return () => {
      if (gameRef.current === k) {
        k.quit()
        gameRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Shut the engine down when the round ends (unmount cleanup then skips it)
  useEffect(() => {
    if (over && gameRef.current) {
      gameRef.current.quit()
      gameRef.current = null
    }
  }, [over])

  const mm = Math.floor(timeLeft / 60)
  const ss = String(timeLeft % 60).padStart(2, '0')

  const holdButton = (key) => ({
    onPointerDown: (e) => { e.preventDefault(); controlsRef.current[key] = true },
    onPointerUp: () => { controlsRef.current[key] = false },
    onPointerLeave: () => { controlsRef.current[key] = false },
  })

  return (
    <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center px-2 py-4 select-none">
      {/* HUD */}
      <div className="w-full max-w-4xl flex items-center justify-between text-white font-black text-xl px-2 mb-2">
        <span>{'❤️'.repeat(Math.max(hearts, 0))}{'🖤'.repeat(Math.max(3 - hearts, 0))}</span>
        <span className={`${timeLeft <= 20 ? 'text-red-400 animate-pulse' : ''}`}>⏱ {mm}:{ss}</span>
        <span className="text-yellow-300">🪙 {score}</span>
      </div>

      {over ? (
        <div className="flex flex-col items-center justify-center text-center text-white py-24">
          <div className="text-7xl mb-4 animate-bounce-in">{hearts > 0 ? '🎉' : '💥'}</div>
          <h2 className="text-4xl font-black mb-2">{hearts > 0 ? "Time's up!" : 'Ouch!'}</h2>
          <p className="text-2xl text-yellow-300 font-bold mb-8">You collected {score} word coins</p>
          <button
            onClick={() => onEnd(score)}
            className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-xl font-black rounded-full px-10 py-4 shadow-xl transition hover:scale-105"
          >
            Back to my lesson
          </button>
        </div>
      ) : (
        <>
          <canvas ref={canvasRef} className="rounded-xl shadow-2xl max-w-full" />
          {lastWord && (
            <div className="text-yellow-300 font-black text-2xl mt-2 animate-pop" key={lastWord + score}>
              {lastWord}
            </div>
          )}
          {/* Touch controls */}
          <div className="flex items-center justify-between w-full max-w-4xl mt-3 sm:hidden">
            <div className="flex gap-3">
              <button {...holdButton('left')} className="bg-white/15 active:bg-white/30 text-white text-3xl rounded-2xl w-16 h-16">◀</button>
              <button {...holdButton('right')} className="bg-white/15 active:bg-white/30 text-white text-3xl rounded-2xl w-16 h-16">▶</button>
            </div>
            <button
              onPointerDown={(e) => { e.preventDefault(); controlsRef.current.jump?.() }}
              className="bg-yellow-400/80 active:bg-yellow-300 text-yellow-900 text-2xl font-black rounded-2xl w-20 h-16"
            >
              JUMP
            </button>
          </div>
          <p className="text-indigo-300 text-sm mt-2 hidden sm:block">← → to run, space to jump. Collect the word coins!</p>
        </>
      )}
    </div>
  )
}
