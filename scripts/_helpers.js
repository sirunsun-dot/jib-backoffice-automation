/**
 * Shared helpers for promo4 test runners.
 */
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const BASE = 'https://devstorex.jibc.codelabdev.co'
const SIGNIN = `${BASE}/auth/sign-in`
const EMAIL = 'sirun.sun@codelabdev.co'
const PASSWORD = 'test123'
const EXEC = process.env.CHROME

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function launchAndLogin(opts = {}) {
  const useDemo = opts.demo || process.env.LOGIN_MODE === 'demo'
  const browser = await puppeteer.launch({
    headless: true, executablePath: EXEC,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=th-TH'],
    defaultViewport: { width: 1920, height: 1080 },
    protocolTimeout: 180000,
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(15000)
  page.on('dialog', async (d) => { try { if (d.type() === 'beforeunload') await d.accept(); else await d.dismiss() } catch {} })
  await page.goto(SIGNIN, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector('input[name="email"]', { visible: true })
  if (useDemo) {
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => /เข้าสู่ระบบ Demo|Demo/i.test(x.textContent.trim()))
      if (b) b.click()
    })
  } else {
    await page.type('input[name="email"]', EMAIL)
    await page.type('input[name="password"]', PASSWORD)
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.textContent.trim() === 'เข้าสู่ระบบ')
      if (b) b.click()
    })
  }
  await page.waitForFunction(() => !location.pathname.includes('/auth/sign-in'), { timeout: 25000 })
  await sleep(1500)
  return { browser, page, loginMode: useDemo ? 'demo' : 'email' }
}

function makeApi(page) {
  const waitText = (t, timeout = 15000) =>
    page.waitForFunction((x) => document.body && document.body.innerText.includes(x), { timeout }, t)
  const hasText = async (t) => page.evaluate((x) => document.body && document.body.innerText.includes(x), t)
  const click = async (sel, text, root = null) => page.evaluate((sel, text, root) => {
    const r = root ? document.querySelector(root) : document
    if (!r) return false
    const els = Array.from(r.querySelectorAll(sel))
    const el = els.find((e) => e.textContent && e.textContent.trim().includes(text) && e.offsetParent !== null)
      || els.find((e) => e.textContent && e.textContent.trim().includes(text))
    if (el) { el.scrollIntoView({ block: 'center' }); el.click(); return true } return false
  }, sel, text, root)
  const typeIn = async (sel, value) => {
    await page.waitForSelector(sel, { visible: true, timeout: 8000 })
    const el = await page.$(sel)
    await el.click({ clickCount: 3 }); await el.press('Backspace')
    await el.type(String(value), { delay: 10 })
  }
  const valueOf = (sel) => page.evaluate((s) => document.querySelector(s)?.value || '', sel)
  const headText = () => page.evaluate(() => Array.from(document.querySelectorAll('thead th')).map((e) => e.textContent.trim()))
  return { sleep, waitText, hasText, click, typeIn, valueOf, headText }
}

class Results {
  constructor() { this.data = {} }
  rec(id, actual, result, note = '') {
    this.data[id] = { actual: String(actual).slice(0, 300), result, ...(note ? { note } : {}) }
    console.log(`${id}: ${result} — ${String(actual).slice(0, 80)}`)
  }
  nt(id, reason) { this.rec(id, reason, 'Not Tested') }
  save(filename) {
    const p = path.join(__dirname, filename)
    fs.writeFileSync(p, JSON.stringify(this.data, null, 2), 'utf8')
    const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
    for (const k of Object.keys(this.data)) sum[this.data[k].result] = (sum[this.data[k].result] || 0) + 1
    console.log(`\n[${filename}] SUMMARY:`, JSON.stringify(sum), 'Total:', Object.keys(this.data).length)
    return p
  }
}

module.exports = { BASE, launchAndLogin, makeApi, Results, sleep }
