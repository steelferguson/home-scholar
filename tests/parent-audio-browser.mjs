import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
const require = createRequire(process.argv[2] || import.meta.url)
const { chromium } = require('playwright')
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
try {
  const context = await browser.newContext({ viewport: { width: 810, height: 1080 }, hasTouch: true })
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  await context.addInitScript(() => {
    window.__HS_SHELL__ = { version: 2 }
    window.nativeCommands = []
    window.ReactNativeWebView = { postMessage: raw => {
      const command = JSON.parse(raw)
      window.nativeCommands.push(command)
      if (command.type === 'play') setTimeout(() => window.__hsNativeEvent(JSON.stringify({ type: 'status', lessonId: command.lessonId, position: 1, duration: 120, playing: true })), 0)
    } }
  })
  const page = await context.newPage(), errors = []
  page.on('pageerror', err => errors.push(err.message))
  await page.goto('http://127.0.0.1:5191/course/spanish/lesson/1')
  await page.getByRole('button', { name: 'Play', exact: true }).waitFor()
  assert.equal(await page.locator('.account-email').innerText(), 'Parent')
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Now playing' }).waitFor()
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('pagehide'))
  })
  assert.equal(await page.locator('.account-email').innerText(), 'Parent')
  assert.deepEqual(await page.evaluate(() => window.nativeCommands.filter(c => ['stop','pause'].includes(c.type))), [])
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.getByRole('link', { name: 'Home Scholar courses' }).click()
  await page.getByRole('heading', { name: 'Your courses' }).waitFor()
  await page.getByRole('button', { name: 'Pause', exact: true }).waitFor()
  await page.evaluate(() => window.__hsNativeEvent(JSON.stringify({ type: 'paused', lessonId: 'spanish-1', position: 45 })))
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('fixture:user_progress') || '[]').some(row => row.profile_id === 'parent' && row.lesson_id === 'spanish-1' && row.last_position_seconds === 45))
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await page.evaluate(() => window.__hsNativeEvent(JSON.stringify({ type: 'ended', lessonId: 'spanish-1' })))
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('fixture:user_progress') || '[]').some(row => row.profile_id === 'parent' && row.lesson_id === 'spanish-1' && row.status === 'completed'))
  assert.deepEqual(await page.evaluate(() => window.nativeCommands.filter(c => ['stop','pause'].includes(c.type))), [])
  await page.reload()
  await page.getByRole('heading', { name: 'Your courses' }).waitFor()
  assert.equal(await page.locator('.account-email').innerText(), 'Parent')
  await page.getByRole('link', { name: 'Parent', exact: true }).click()
  await page.getByRole('button', { name: /^Zinc/ }).click()
  await page.getByRole('heading', { name: 'Your courses' }).waitFor()
  assert.equal(await page.locator('.account-email').innerText(), 'Zinc')
  assert.equal(await page.evaluate(() => window.nativeCommands.at(-1).type), 'stop')
  await page.getByRole('link', { name: 'Parent', exact: true }).click()
  await page.getByLabel('Parent password', { exact: true }).waitFor()
  assert.deepEqual(errors, [])
  console.log('PASS: parent opens without reauth, hide/pagehide send no stop, navigation preserves player, off-page native events save parent progress/completion, parent survives reload, switching to child stops audio and locks controls')
} finally { await browser.close() }
