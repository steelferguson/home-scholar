// Offline browser check: a parent assigns courses; children see only theirs.
// Usage: node tests/profiles-serve.mjs & node tests/assignments-browser.mjs [/abs/path/to/package.json with playwright]
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
  await page.goto('http://127.0.0.1:5191/')
  await page.evaluate(() => localStorage.clear()); await page.reload()
  await page.getByRole('link', { name: 'Parent', exact: true }).click()
  await page.getByRole('button', { name: /^Rush/ }).click()
  await page.getByRole('link', {name:'Start'}).waitFor()
  assert.deepEqual(await page.locator('.lesson-row h2').allTextContents(), [
    'Math Facts · Addition','Math Facts · Subtraction','Math Facts · Mixed','Math Facts · Mixed','Spanish Quest · A new beginning',
  ])
  assert.equal(await page.locator('.lesson-row a').count(),1)
  for (const path of ['/course/harmony', '/course/math-facts/lesson/2', '/course/spanish-kids-1/lesson/1']) {
    await page.goto('http://127.0.0.1:5191' + path)
    await page.waitForURL('http://127.0.0.1:5191/')
  }
  await page.getByLabel('Switch kid').selectOption('zinc')
  assert.equal(await page.locator('.account-email').innerText(),'Zinc')
  await page.getByRole('link', {name:/Harmony/}).waitFor()
  assert.equal(await page.locator('.course-button').count(),7)
  const audio = 'http://127.0.0.1:5191/course/harmony/lesson/3'
  await page.goto(audio)
  await page.getByRole('button',{name:'Mark complete'}).click()
  await page.getByText('+10¢ 💵').waitFor()
  await page.reload()
  await page.getByRole('button',{name:'Mark complete'}).click()
  await page.getByText('+5¢ 💵').waitFor()
  await page.goto('http://127.0.0.1:5191/parent')
  await page.getByLabel('Parent password').waitFor()
  assert.deepEqual(errors, [])
  console.log('PASS: fixed daily plan, sibling switch and direct links guarded; no page errors')
} finally { await browser.close() }
