/** Lightweight screenshots for สินค้า manual */
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const BASE = 'https://devstorex.jibc.codelabdev.co'
const EXEC = process.env.CHROME
const OUT = path.join(__dirname, '../docs/images/products')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await puppeteer.launch({
    headless: true, executablePath: EXEC,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=th-TH'],
    defaultViewport: { width: 1920, height: 1080 },
    protocolTimeout: 240000,
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(60000)
  page.on('dialog', async (d) => { try { if (d.type() === 'beforeunload') await d.accept(); else await d.dismiss() } catch {} })

  const shot = async (name, opts = {}) => {
    try {
      await page.screenshot({ path: path.join(OUT, `${name}.png`), captureBeyondViewport: false, ...opts })
      console.log('shot:', name)
    } catch (e) { console.log('shot FAIL', name, e.message) }
  }
  const click = async (sel, text) => page.evaluate((sel, text) => {
    const el = Array.from(document.querySelectorAll(sel)).find((e) => e.textContent && e.textContent.trim().includes(text) && e.offsetParent !== null)
    if (el) { el.scrollIntoView({ block: 'center' }); el.click(); return true } return false
  }, sel, text)

  // Login
  await page.goto(`${BASE}/auth/sign-in`, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector('input[name="email"]', { visible: true })
  await page.type('input[name="email"]', 'sirun.sun@codelabdev.co')
  await page.type('input[name="password"]', 'test123')
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => x.textContent.includes('เข้าสู่ระบบ'))
    if (b) b.click()
  })
  await page.waitForFunction(() => !location.pathname.includes('/auth/sign-in'), { timeout: 25000 })
  await sleep(2000)

  // ============ Manual screenshots ============
  // 01 LIST
  console.log('\n--- LIST ---')
  await page.goto(`${BASE}/store/product-manager/products`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(5000)
  await shot('01-list')

  // 02 list with tabs visible (already in 01) - capture tabs detail
  // 03 search
  try {
    await page.type('input[placeholder="ค้นหา"]', 'JIB', { delay: 30 })
    await sleep(2500)
    await shot('02-search')
    await page.$eval('input[placeholder="ค้นหา"]', (e) => { e.value = '' })
  } catch (e) { console.log('search skip:', e.message) }

  // 04 filter sheet
  await page.goto(`${BASE}/store/product-manager/products`, { waitUntil: 'domcontentloaded' })
  await sleep(4000)
  try {
    await click('button', 'ตัวกรอง')
    await sleep(1500)
    await shot('03-filter-sheet')
    await page.keyboard.press('Escape')
    await sleep(800)
  } catch (e) { console.log('filter skip:', e.message) }

  // 05 customize columns
  try {
    await click('button', 'ปรับแต่งคอลัมน์')
    await sleep(1500)
    await shot('04-customize-columns')
    await page.keyboard.press('Escape')
    await sleep(800)
  } catch (e) { console.log('customize skip:', e.message) }

  // 06 trash tab
  try {
    await click('button', 'ถังขยะ')
    await sleep(3000)
    await shot('05-trash-tab')
    await click('button', 'ทั้งหมด')
    await sleep(2000)
  } catch (e) { console.log('trash skip:', e.message) }

  // 07 row 3-dot menu
  try {
    await page.goto(`${BASE}/store/product-manager/products`, { waitUntil: 'domcontentloaded' })
    await sleep(3000)
    const om = await page.$('button[aria-label="Open menu"]')
    if (om) {
      await om.click()
      await sleep(1200)
      await shot('06-row-menu')
      await page.keyboard.press('Escape')
    }
  } catch (e) { console.log('menu skip:', e.message) }

  // ============ CREATE ============
  console.log('\n--- CREATE ---')
  await page.goto(`${BASE}/store/product-manager/products/create`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(7000) // longer wait for heavy page
  await shot('07-create-overview')

  // navigate through sections via top scroll positions
  // 08 sections list
  try {
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'ข้อมูลทั่วไป')
      if (el) el.scrollIntoView({ block: 'start' })
    })
    await sleep(2000)
    await shot('08-create-general-info')
  } catch (e) { console.log('general skip:', e.message) }

  // Click each section
  for (const [name, section] of [
    ['09-create-media', 'รูปภาพ'],
    ['10-create-feature', 'ไฮไลท์'],
    ['11-create-attributes', 'คุณสมบัติ'],
    ['12-create-inventory', 'คลังสินค้า'],
    ['13-create-tags', 'แท็กสินค้า'],
    ['14-create-filters', 'ตัวกรองสินค้า'],
    ['15-create-seo', 'SEO'],
  ]) {
    try {
      await click('button', section)
      await sleep(3000)
      await shot(name)
    } catch (e) { console.log(`${name} skip:`, e.message) }
  }

  // ============ EDIT ============
  console.log('\n--- EDIT ---')
  await page.goto(`${BASE}/store/product-manager/products`, { waitUntil: 'domcontentloaded' })
  await sleep(3500)
  const editHref = await page.evaluate(() => { const a = document.querySelector('tbody a[href*="/products/update/"]'); return a ? a.href : null })
  if (editHref) {
    await page.goto(editHref, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(6000)
    await shot('16-edit-page')
  }

  await browser.close()
  console.log('\nDONE')
}
main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
