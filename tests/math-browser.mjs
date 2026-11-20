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
  await page.getByRole('button', { name: /^Zinc/ }).click()
  await page.getByRole('link', { name: 'Start' }).click()
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
      await page.getByText(`Not quite. It’s ${correct}. You’ll see this one again.`).waitFor()
      assert.equal(await page.getByTestId('wrong').innerText(), String(correct + 1), 'the typed wrong answer is shown')
      assert.equal(await page.getByTestId('answer').innerText(), String(correct), 'the right answer is shown')
      await page.screenshot({ path: `${shots}/home-scholar-math-wrong.png` })
      await page.getByRole('button', { name: 'Got it' }).click()
      continue
    }
    if (seen.length === 3) { await page.getByRole('button', { name: '1', exact: true }).click(); await page.screenshot({ path: `${shots}/home-scholar-math-keypad.png` }); await page.getByRole('button', { name: 'Delete' }).click() }
    await type(correct)
    await page.getByText('Yes!').or(page.getByRole('heading', { name: 'Set complete!' })).first().waitFor()
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
  await page.getByRole('button', {name:'Done'}).click()
  await page.getByRole('link', {name:'Start'}).waitFor()
  assert.match(await page.locator('.lesson-row').first().innerText(), /Complete/)
  assert.match(await page.getByRole('link', {name:'Start'}).getAttribute('href'), /lesson\/2$/)
  assert.deepEqual(errors, [])
  console.log('PASS: scheduled Math Facts, keypad answers, wrong answer returns, results 19/20, stats stored per fact, next set unlocked; no page errors')
} finally { await browser.close() }
