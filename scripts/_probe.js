// Probe live DOM structure of template-options & mapping-conditions pages
const puppeteer = require('puppeteer')
const BASE = 'https://devstorex.jibc.codelabdev.co'
const EXEC = process.env.CHROME
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function probe(page, label, url) {
  console.log('\n========================================')
  console.log('PAGE:', label, '|', url)
  console.log('========================================')
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(3500)
  const info = await page.evaluate(() => {
    const txt = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50)
    const inputs = Array.from(document.querySelectorAll('input,textarea')).map((e) => ({
      tag: e.tagName.toLowerCase(),
      name: e.getAttribute('name') || '',
      type: e.getAttribute('type') || '',
      ph: e.getAttribute('placeholder') || '',
      role: e.getAttribute('role') || '',
    }))
    const buttons = Array.from(document.querySelectorAll('button')).map((e) => ({
      t: txt(e),
      aria: e.getAttribute('aria-label') || '',
      role: e.getAttribute('role') || '',
    })).filter((b) => b.t || b.aria)
    const combos = Array.from(document.querySelectorAll('[role="combobox"]')).map((e) => txt(e))
    const radios = Array.from(document.querySelectorAll('[role="radio"], label')).map((e) => txt(e)).filter(Boolean)
    const switches = Array.from(document.querySelectorAll('[role="switch"]')).map((e) => ({ t: txt(e.parentElement || e), state: e.getAttribute('data-state') || e.getAttribute('aria-checked') }))
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,p')).map((e) => txt(e)).filter((t) => t && t.length > 2).slice(0, 25)
    return { inputs, buttons, combos, radios: [...new Set(radios)].slice(0, 40), switches, headings }
  })
  console.log('HEADINGS:', JSON.stringify(info.headings, null, 0))
  console.log('INPUTS:', JSON.stringify(info.inputs, null, 0))
  console.log('BUTTONS:', JSON.stringify(info.buttons.map((b) => b.t || `[${b.aria}]`)))
  console.log('COMBOBOXES:', JSON.stringify(info.combos))
  console.log('SWITCHES:', JSON.stringify(info.switches))
  console.log('RADIOS/LABELS:', JSON.stringify(info.radios))
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: EXEC,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=th-TH'],
    defaultViewport: { width: 1920, height: 1080 },
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(20000)
  // login
  await page.goto(`${BASE}/auth/sign-in`, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector('input[name="email"]', { visible: true })
  await page.type('input[name="email"]', 'sirun.sun@codelabdev.co')
  await page.type('input[name="password"]', 'test123')
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => x.textContent.includes('เข้าสู่ระบบ'))
    if (b) b.click()
  })
  await page.waitForFunction(() => !location.pathname.includes('/auth/sign-in'), { timeout: 25000 })
  await sleep(1500)

  await probe(page, 'TO-LIST', `${BASE}/store/product-manager/template-options`)
  await probe(page, 'TO-CREATE', `${BASE}/store/product-manager/template-options/create`)
  await probe(page, 'MC-LIST', `${BASE}/store/product-manager/template-mapping-conditions`)
  await probe(page, 'MC-CREATE', `${BASE}/store/product-manager/template-mapping-conditions/create`)

  await browser.close()
}
main().catch((e) => { console.error('ERR', e.message); process.exit(1) })
