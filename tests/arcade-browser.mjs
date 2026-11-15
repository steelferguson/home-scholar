// Offline browser check for Spanish Quest on a touch iPad: play a round (the
// first finish pays 10 cents), buy the arcade with the coins, and prove the
// on-screen Run and Jump buttons move the player. Steel's iPad showed no way
// to move because the controls were hidden on screens 640px and wider.
// Usage: node tests/profiles-serve.mjs & node tests/arcade-browser.mjs [/abs/path/package.json with playwright]
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
const require = createRequire(process.argv[2] || import.meta.url)
const { chromium } = require('playwright')
const shots = process.env.SCREENSHOT_DIR || '/private/tmp'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const errors = []
try {
  const context = await browser.newContext({ viewport: { width: 810, height: 1080 }, hasTouch: true })
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:5191/parent')
  await page.evaluate(() => localStorage.clear()); await page.reload()
  await page.locator('.family-courses fieldset').first().waitFor()
  await page.locator('.family-courses fieldset', { has: page.locator('legend', { hasText: 'Zinc’s courses' }) }).getByLabel(/^Spanish Quest/).check()
  await page.getByRole('button', { name: /^Zinc/ }).click()
  await page.getByRole('heading', { name: 'My money' }).waitFor()

  await page.goto('http://127.0.0.1:5191/course/kids/lesson/1')
  await page.getByRole('button', { name: /Let.s go/ }).click()
  for (const emoji of ['🐱', '🐶']) {
    await page.getByRole('button', { name: emoji }).first().waitFor()
    await page.getByRole('button', { name: emoji }).first().click()
    await page.waitForTimeout(1300)
  }
  await page.getByText('2 / 2 first try').waitFor()
  await page.getByTestId('earned').waitFor()
  assert.equal(await page.getByTestId('earned').innerText(), '+10¢ 💵', 'first Spanish finish pays 10 cents')
  await page.getByRole('button', { name: /Play Arcade/ }).click()
  await page.getByTestId('arcade-touch-controls').waitFor()
  const layout = await page.evaluate(() => ({ stage: document.querySelector('[data-testid=arcade-stage]').getBoundingClientRect().toJSON(), controls: document.querySelector('[data-testid=arcade-touch-controls]').getBoundingClientRect().toJSON(), inner: innerHeight }))
  assert.ok(layout.controls.bottom <= layout.inner, `controls fit on screen without scrolling: bottom ${layout.controls.bottom} of ${layout.inner}`)
  assert.ok(Math.abs(layout.stage.width / layout.stage.height - 16 / 9) < 0.05, `stage keeps 16:9: ${layout.stage.width}x${layout.stage.height}`)
  await page.screenshot({ path: `${shots}/home-scholar-arcade-touch.png` })
  await page.waitForTimeout(800)
  const at = () => page.evaluate(() => window.__hsArcade())
  const start = await at()
  const right = page.getByRole('button', { name: 'Run right' })
  const box = await right.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down()
  await page.waitForTimeout(700)
  await page.mouse.up()
  const moved = await at()
  assert.ok(moved.x > start.x + 80, `player ran right: ${start.x} -> ${moved.x}`)
  await page.waitForTimeout(300)
  const rest = await at()
  assert.ok(Math.abs(rest.x - moved.x) < 30, 'releasing the button stops the run')
  await page.getByRole('button', { name: 'Jump' }).dispatchEvent('pointerdown', { button: 0, pointerId: 1, isPrimary: true })
  await page.waitForTimeout(150)
  const air = await at()
  assert.ok(air.y < rest.y - 10, `player jumped: ${rest.y} -> ${air.y}`)
  assert.equal(await page.getByText('space to jump').count(), 0, 'keyboard hint hidden on touch devices')
  assert.deepEqual(errors, [])
  console.log('PASS: Spanish round pays 10 cents, arcade opens, touch Run and Jump controls show at iPad width and move the player; no page errors')
} catch (error) {
  console.log('page errors:', errors.join(' || '))
  throw error
} finally { await browser.close() }
