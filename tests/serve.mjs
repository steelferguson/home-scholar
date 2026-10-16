import { createServer } from 'vite'
import config from '../vite.config.js'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
const audio = Buffer.alloc(44 + 120 * 8000 * 2)
audio.write('RIFF', 0); audio.writeUInt32LE(audio.length - 8, 4); audio.write('WAVEfmt ', 8)
audio.writeUInt32LE(16, 16); audio.writeUInt16LE(1, 20); audio.writeUInt16LE(1, 22)
audio.writeUInt32LE(8000, 24); audio.writeUInt32LE(16000, 28); audio.writeUInt16LE(2, 32); audio.writeUInt16LE(16, 34)
audio.write('data', 36); audio.writeUInt32LE(audio.length - 44, 40)
const fixture = {
  name: 'local-only-fixture', enforce: 'pre',
  transformIndexHtml(html) {
    return html.replace('/src/main.jsx', '/tests/fixtures/browser.jsx').replace('<div id="root">', '<div id="fixture-tools"></div><div id="root">')
  },
  load(id) {
    if (id === resolve(root, 'src/supabaseClient.js')) return "export { supabase } from '/tests/fixtures/supabase.js'"
  },
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/tests/tone.wav') {
        const match = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '')
        const start = match ? Number(match[1]) : 0
        const end = match?.[2] ? Number(match[2]) : audio.length - 1
        res.writeHead(match ? 206 : 200, { 'Content-Type': 'audio/wav', 'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1, ...(match ? { 'Content-Range': `bytes ${start}-${end}/${audio.length}` } : {}) })
        res.end(audio.subarray(start, end + 1)); return
      }
      if (req.url === '/tests/visual.json') {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ steps: [{ type: 'text', title: 'A new beginning', body: 'Every big idea starts with a small question.' }, { type: 'text', title: 'Try it for yourself', body: 'Explore the next step.' }] })); return
      }
      next()
    })
  },
}
const server = await createServer({ ...config, configFile: false, root, envFile: false,
  plugins: [fixture, ...config.plugins], server: { host: '127.0.0.1', port: 5187, strictPort: true } })
await server.listen()
console.log('Home Scholar local fixture ready at http://127.0.0.1:5187/')
