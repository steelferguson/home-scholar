// Offline browser check for the kids wallet: a practice set pays 10 cents, the
// dashboard card shows balance and daily goal, the cap stops payment, a parent
// adjusts with a reason. The fixture mirrors award_wallet() from setup_wallet.sql.
// Usage: node tests/profiles-serve.mjs & node tests/wallet-browser.mjs [/abs/path/package.json with playwright]
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
  page.on('pageerror', error => errors.push(error.message)); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('CONSOLE', m.type(), m.text().slice(0, 200)) })
  await page.goto('http://127.0.0.1:5191/parent')
  await page.evaluate(() => localStorage.clear()); await page.reload()
  await page.getByRole('button', { name: /^Rush/ }).click()
  await page.getByRole('heading', { name: 'My money' }).waitFor()
  assert.equal(await page.getByTestId('wallet-balance').innerText(), '$0.00')
  await page.getByText('Today: 0¢ of 50¢').waitFor()

  const playSet = async () => {
    await page.getByRole('button', { name: 'Start', exact:true }).click()
    const answer = page.getByTestId('answer')
    for (let i = 0; i < 25; i++) {
      if (await page.getByRole('heading', { name: 'Set complete!' }).count()) break
      await page.getByRole('button', { name: 'Check answer' }).waitFor()
      const [a, op, b] = await answer.locator('xpath=..').locator('span').allInnerTexts()
      const value = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b)
      for (const ch of String(value)) await page.getByRole('button', { name: ch, exact: true }).click()
      await page.getByRole('button', { name: 'Check answer' }).click()
      await page.getByText('Yes!').or(page.getByRole('heading', { name: 'Set complete!' })).first().waitFor(); await page.waitForTimeout(550)
    }
    await page.getByRole('heading', { name: 'Set complete!' }).waitFor()
  }
  await page.goto('http://127.0.0.1:5191/course/math-facts/lesson/1')
  await playSet()
  await page.getByTestId('earned').waitFor()
  assert.equal(await page.getByTestId('earned').innerText(), '+10¢ 💵')
  await page.screenshot({ path: `${shots}/home-scholar-wallet-earned.png` })
  await page.getByRole('button', { name: 'Done' }).click()
  await page.goto('http://127.0.0.1:5191/')
  await page.getByText('Today: 10¢ of 50¢').waitFor()
  assert.equal(await page.getByTestId('wallet-balance').innerText(), '$0.10')
  await page.getByText('Practice set').first().waitFor()
  await page.screenshot({ path: `${shots}/home-scholar-wallet-card.png`, fullPage: true })

  // Cap: with 35 cents already today a set pays 10, the next only 5, the next nothing.
  await page.evaluate(() => {
    const rows = JSON.parse(localStorage.getItem('fixture:wallet_entries') || '[]')
    rows.push({ id: 'seed', user_id: 'family', profile_id: 'rush', cents: 25, kind: 'practice', created_at: new Date().toISOString() })
    localStorage.setItem('fixture:wallet_entries', JSON.stringify(rows))
  })
  await page.goto('http://127.0.0.1:5191/course/math-facts/lesson/2'); await playSet()
  await page.getByTestId('earned').waitFor()
  assert.equal(await page.getByTestId('earned').innerText(), '+10¢ 💵')
  await page.getByRole('button', { name: 'Done' }).click(); await page.getByRole('link',{ name: 'Start' }).click(); await playSet()
  await page.getByTestId('earned').waitFor()
  assert.equal(await page.getByTestId('earned').innerText(), '+5¢ 💵', 'cap trims the award to what is left')
  await page.getByRole('button', { name: 'Done' }).click(); await page.getByRole('link',{ name: 'Start' }).click(); await playSet()
  await page.getByTestId('earned').waitFor()
  assert.match(await page.getByTestId('earned').innerText(), /Daily goal reached/)
  await page.screenshot({ path: `${shots}/home-scholar-wallet-capped.png` })
  await page.goto('http://127.0.0.1:5191/')
  await page.getByText('Daily goal reached! Come back tomorrow.').waitFor()

  // Parent adjusts with a reason.
  await page.getByRole('link', { name: 'Parent', exact: true }).click()
  await page.getByLabel('Parent password').waitFor()
  await page.getByLabel('Parent password').fill('test-parent-password')
  await page.getByRole('button', { name: 'Unlock parent controls' }).click()
  await page.getByRole('heading', { name: 'Family profiles' }).or(page.getByRole('alert')).first().waitFor()
  if (await page.getByRole('alert').count()) console.log('ALERT:', await page.getByRole('alert').first().innerText())
  await page.locator('#family-money-heading').waitFor()
  const before = await page.getByTestId('balance-Rush').innerText()
  const money = page.locator('.family-money fieldset', { has: page.locator('legend', { hasText: 'Rush' }) })
  await money.getByLabel(/^Change/).fill('-20'); await money.getByLabel('Reason').fill('bought a toy')
  await money.getByRole('button', { name: /Adjust Rush/ }).click()
  await money.getByText('bought a toy').waitFor()
  const after = await page.getByTestId('balance-Rush').innerText()
  assert.equal(Math.round((Number(before.slice(1)) - Number(after.slice(1))) * 100), 20, `balance ${before} -> ${after}`)
  await page.screenshot({ path: `${shots}/home-scholar-wallet-parent.png`, fullPage: true })
  // A reload relocks parent controls (parent authorization is in memory only).
  await page.reload(); await page.getByLabel('Parent password').waitFor()
  await page.getByLabel('Parent password').fill('test-parent-password'); await page.getByRole('button', { name: 'Unlock parent controls' }).click()
  await page.locator('#family-money-heading').waitFor()
  assert.equal(await page.getByTestId('balance-Rush').innerText(), after, 'adjustment persists')
  assert.deepEqual(errors, [])
  console.log('PASS: practice set pays 10, card shows balance and goal, cap trims then stops, parent adjustment with reason persists; no page errors')
} catch (error) {
  const page = browser.contexts()[0]?.pages()[0]
  if (page) console.log('AT FAILURE:', page.url(), '| headings:', (await page.locator('h1, h2').allInnerTexts().catch(() => [])).join(' | '), '| alerts:', (await page.getByRole('alert').allInnerTexts().catch(() => [])).join(' | '), '| page errors:', errors.join(' || '))
  throw error
} finally { await browser.close() }
