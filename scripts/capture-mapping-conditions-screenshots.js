/**
 * จับภาพหน้าจอ flow เงื่อนไขความเข้ากันได้ (Template Mapping Conditions / Rule Builder) ด้วย Puppeteer
 * รัน: CHROME="<path>" node scripts/capture-mapping-conditions-screenshots.js
 * ผลลัพธ์: docs/images/mapping-conditions/NN-*.png
 * หมายเหตุ: ไม่บันทึก record ใหม่ (เลี่ยงสร้าง rule ขยะ) - list มีข้อมูลตัวอย่างอยู่แล้ว
 */
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const BASE = 'https://devstorex.jibc.codelabdev.co'
const SIGNIN = `${BASE}/auth/sign-in`
const LIST_URL = `${BASE}/store/product-manager/template-mapping-conditions`
const CREATE_URL = `${LIST_URL}/create`
const OUT_DIR = path.join(__dirname, '../docs/images/mapping-conditions')
const EXEC = process.env.CHROME || process.env.PUPPETEER_EXECUTABLE_PATH || undefined
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: EXEC,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=th-TH'],
    defaultViewport: { width: 1920, height: 1080 },
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(20000)

  const shot = async (name) => {
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`) })
    console.log('shot:', name)
  }
  const waitText = (t, timeout = 20000) =>
    page.waitForFunction((x) => document.body && document.body.innerText.includes(x), { timeout }, t)
  const waitNoSkeleton = () =>
    page.waitForFunction(() => !document.querySelector('[data-slot="skeleton"]'), { timeout: 20000 }).catch(() => {})

  const clickByText = async (sel, text, rootSel = null) => {
    const ok = await page.evaluate((sel, text, rootSel) => {
      const root = rootSel ? document.querySelector(rootSel) : document
      if (!root) return false
      const els = Array.from(root.querySelectorAll(sel))
      const el = els.find((e) => e.textContent && e.textContent.includes(text) && e.offsetParent !== null)
        || els.find((e) => e.textContent && e.textContent.includes(text))
      if (el) { el.scrollIntoView({ block: 'center' }); el.click(); return true }
      return false
    }, sel, text, rootSel)
    if (!ok) throw new Error(`clickByText failed: <${sel}> "${text}"`)
  }
  const scrollToText = async (text, block = 'start') => {
    await page.evaluate((text, block) => {
      const els = Array.from(document.querySelectorAll('p,h1,h2,h3,label,span,div'))
      const el = els.find((e) => e.textContent && e.textContent.trim().startsWith(text))
      if (el) el.scrollIntoView({ block, behavior: 'instant' })
    }, text, block)
    await sleep(700)
  }
  const typeIn = async (name, value) => {
    const sel = `input[name="${name}"], textarea[name="${name}"]`
    await page.waitForSelector(sel, { visible: true })
    const el = await page.$(sel)
    await el.click({ clickCount: 3 }); await el.press('Backspace')
    await el.type(String(value), { delay: 15 })
  }

  // ---- LOGIN ----
  console.log('login...')
  await page.goto(SIGNIN, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector('input[name="email"]', { visible: true })
  await page.type('input[name="email"]', 'sirun.sun@codelabdev.co')
  await page.type('input[name="password"]', 'test123')
  await clickByText('button', 'เข้าสู่ระบบ')
  await page.waitForFunction(() => !location.pathname.includes('/auth/sign-in'), { timeout: 25000 })
  await sleep(1500)

  // ---- LIST ----
  console.log('list...')
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await waitText('เงื่อนไขความเข้ากันได้')
  await waitNoSkeleton()
  await sleep(1500)
  await shot('01-list')

  await page.waitForSelector('input[placeholder="ค้นหา"]', { visible: true })
  await page.type('input[placeholder="ค้นหา"]', 'Case', { delay: 25 })
  await sleep(1600)
  await shot('02-search')
  const s = await page.$('input[placeholder="ค้นหา"]')
  await s.click({ clickCount: 3 }); await s.press('Backspace')
  await sleep(800)

  // ตัวกรอง (filter sheet)
  try {
    await clickByText('button', 'ตัวกรอง')
    await page.waitForSelector('[role="dialog"]', { visible: true, timeout: 6000 })
    await sleep(700)
    await shot('03-filter-sheet')
    await page.keyboard.press('Escape'); await sleep(600)
  } catch (e) { console.log('skip 03:', e.message) }

  // ---- CREATE ----
  console.log('create...')
  await page.goto(CREATE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await waitText('เพิ่มเงื่อนไข')
  await waitText('การแจ้งเตือน')
  await sleep(1200)

  // กรอกชื่อให้ดูสมจริง
  try { await typeIn('name', 'PSU watt ≥ ผลรวม watt ของชิ้นส่วน') } catch (e) { console.log('name issue:', e.message) }
  await page.evaluate(() => window.scrollTo(0, 0))
  await sleep(500)
  await shot('04-create-overview')

  // LHS template dropdown
  try {
    await clickByText('[role="combobox"]', 'เลือก template')
    await page.waitForSelector('[role="option"]', { visible: true, timeout: 6000 })
    await sleep(600)
    await shot('05-lhs-template-dropdown')
    await page.keyboard.press('Escape'); await sleep(600)
  } catch (e) { console.log('skip 05:', e.message); await page.keyboard.press('Escape') }

  // Operator dropdown
  try {
    await scrollToText('ตัวเปรียบเทียบ')
    await clickByText('[role="combobox"]', 'น้อยกว่าหรือเท่ากับ')
    await page.waitForSelector('[role="option"]', { visible: true, timeout: 6000 })
    await sleep(600)
    await shot('06-operator-dropdown')
    await page.keyboard.press('Escape'); await sleep(600)
  } catch (e) { console.log('skip 06:', e.message); await page.keyboard.press('Escape') }

  // RHS section
  try {
    await scrollToText('ฝั่งขวา (RHS)')
    await sleep(500)
    await shot('07-rhs-section')
  } catch (e) { console.log('skip 07:', e.message) }

  // Notification section (ระดับ + display + alert TH/EN)
  try {
    await scrollToText('การแจ้งเตือน')
    await sleep(500)
    await shot('08-notification-section')
  } catch (e) { console.log('skip 08:', e.message) }

  await browser.close()
  console.log('DONE (no record saved).')
}
main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
