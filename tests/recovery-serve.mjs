import { createServer } from 'vite'
import config from '../vite.config.js'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
const server = await createServer({ ...config, configFile: false, root, envFile: false,
  plugins: [{ name: 'offline-profiles', enforce: 'pre', load(id) {
    if (id === resolve(root, 'src/supabaseClient.js')) return "export { supabase } from '/tests/recovery-backend.js'"
  } }, ...config.plugins], server: { host: '127.0.0.1', port: 5192, strictPort: true } })
await server.listen()
console.log('Offline profiles fixture ready on port 5192')
