// Offline browser check for Math Facts: assign, open a set, type 20 answers on the
// keypad (one deliberately wrong), see it return, finish, replay.
// Usage: node tests/profiles-serve.mjs & node tests/math-browser.mjs [/abs/path/package.json with playwright]
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
const require = createRequire(process.argv[2] || import.meta.url)
const { chromium } = require('playwright')
const shots = process.env.SCREENSHOT_DIR || '/private/tmp'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
try {
  const context = await browser.newContext({ viewport: { width: 810, height: 1080 }, hasTouch: true })
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  const page = await context.newPage()
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:5191/parent')
  await page.evaluate(() => localStorage.clear()); await page.reload()
  await page.locator('fieldset').first().waitFor()
  const zinc = page.locator('fieldset', { has: page.locator('legend', { hasText: 'Zinc’s courses' }) })
  await zinc.getByLabel(/^Math Facts/).check()
  await page.getByRole('button', { name: /^Zinc/ }).click()
  await page.getByRole('heading', { name: 'Your courses' }).waitFor()
  await page.getByRole('link', { name: /Math Facts/ }).click()
  await page.getByRole('heading', { name: 'Math Facts' }).waitFor()
  await page.locator('.lesson-row').first().waitFor()
  assert.equal(await page.locator('.lesson-row').count(), 3)
  assert.match(await page.locator('.lesson-row').first().innerText(), /Practice set/)
  await page.locator('.lesson-row').first().click()
  await page.getByRole('button', { name: 'Start' }).waitFor()
  await page.screenshot({ path: `${shots}/home-scholar-math-intro.png` })
  await page.getByRole('button', { name: 'Start' }).click()
  const answer = page.getByTestId('answer')
  const readFact = async () => {
    const parts = await answer.locator('xpath=..').locator('span').allInnerTexts()
    const [a, op, b] = parts; return op === '+' ? Number(a) + Number(b) : Number(a) - Number(b)
  }
  const type = async value => { for (const ch of String(value)) await page.getByRole('button', { name: ch, exact: true }).click(); await page.getByRole('button', { name: 'Check answer' }).click() }
  const seen = []
  let wrongDone = false
  for (let i = 0; i < 40; i++) {
    if (await page.getByRole('heading', { name: 'Set complete!' }).count()) break
    await page.getByRole('button', { name: 'Check answer' }).waitFor()
    const correct = await readFact(); seen.push(correct)
    if (!wrongDone) {
      await type(correct + 1); wrongDone = true
      await page.getByText(`It’s ${correct}. You’ll see this one again.`).waitFor()
      await page.screenshot({ path: `${shots}/home-scholar-math-wrong.png` })
      await page.getByRole('button', { name: 'Got it' }).click()
      continue
    }
    if (seen.length === 3) { await page.getByRole('button', { name: '1', exact: true }).click(); await page.screenshot({ path: `${shots}/home-scholar-math-keypad.png` }); await page.getByRole('button', { name: 'Delete' }).click() }
    await type(correct)
    await page.getByText('Yes!').waitFor()
    await page.waitForTimeout(550)
  }
  await page.getByRole('heading', { name: 'Set complete!' }).waitFor()
  assert.equal(seen.length, 21, 'twenty questions plus the one that came back')
  await page.getByText('19 of 20 right the first time').waitFor()
  await page.screenshot({ path: `${shots}/home-scholar-math-results.png` })
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fixture:flashcard_progress') || '[]'))
  assert.equal(stored.length, 20, 'one stats row per fact')
  assert.equal(stored.filter(row => row.incorrect_count === 1).length, 1, 'the miss is recorded once')
  assert.ok(stored.every(row => row.profile_id === 'zinc' && row.deck_id === 'deck-math'))
  await page.getByRole('button', { name: 'Play again' }).click()
  await page.getByRole('button', { name: 'Check answer' }).waitFor()
  assert.equal(await page.getByRole('progressbar', { name: 'Questions answered' }).getAttribute('aria-valuenow'), '0', 'replay starts fresh')
  await page.getByRole('button', { name: 'Exit' }).click()
  await page.getByRole('heading', { name: 'Math Facts' }).waitFor()
  await page.locator('.lesson-row').first().waitFor()
  assert.match(await page.locator('.lesson-row').first().innerText(), /Completed/)
  assert.deepEqual(errors, [])
  console.log('PASS: assign Math Facts, 3 practice sets, keypad answers, wrong answer returns, results 19/20, stats stored per fact, replay fresh, lesson completed; no page errors')
} finally { await browser.close() }
