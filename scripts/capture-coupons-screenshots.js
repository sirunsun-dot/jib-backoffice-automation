/**
 * จับภาพหน้าจอ flow คูปอง (Coupons) สำหรับคู่มือผู้ใช้ ด้วย Puppeteer
 * ใช้ในกรณีที่ Cypress binary รันใน environment นี้ไม่ได้
 *
 * รัน: CHROME="<path-to-chrome>" node scripts/capture-coupons-screenshots.js
 * ผลลัพธ์: docs/images/coupons/NN-*.png
 */
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const BASE = 'https://devstorex.jibc.codelabdev.co'
const SIGNIN = `${BASE}/auth/sign-in`
const LIST_URL = `${BASE}/store/promotion-manager/coupons`
const EMAIL = 'sirun.sun@codelabdev.co'
const PASSWORD = 'test123'

const OUT_DIR = path.join(__dirname, '../docs/images/coupons')
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

  // ---------- helpers ----------
  const waitText = (text, timeout = 20000) =>
    page.waitForFunction((t) => document.body && document.body.innerText.includes(t), { timeout }, text)

  const waitNoSkeleton = () =>
    page.waitForFunction(() => !document.querySelector('[data-slot="skeleton"]'), { timeout: 20000 })

  // คลิก element แรกที่ตรง selector + มี text (เลือก root ได้)
  const clickByText = async (sel, text, rootSel = null) => {
    const ok = await page.evaluate(
      (sel, text, rootSel) => {
        const root = rootSel ? document.querySelector(rootSel) : document
        if (!root) return false
        const els = Array.from(root.querySelectorAll(sel))
        const el = els.find((e) => e.textContent && e.textContent.includes(text) && e.offsetParent !== null)
          || els.find((e) => e.textContent && e.textContent.includes(text))
        if (el) {
          el.scrollIntoView({ block: 'center' })
          el.click()
          return true
        }
        return false
      },
      sel,
      text,
      rootSel
    )
    if (!ok) throw new Error(`clickByText failed: <${sel}> "${text}"` + (rootSel ? ` in ${rootSel}` : ''))
  }

  const typeIn = async (name, value, rootSel = null) => {
    const sel = `${rootSel ? rootSel + ' ' : ''}input[name="${name}"]`
    await page.waitForSelector(sel, { visible: true })
    const el = await page.$(sel)
    await el.click({ clickCount: 3 })
    await el.press('Backspace')
    await el.type(String(value), { delay: 15 })
  }

  // ---------- LOGIN ----------
  console.log('login...')
  await page.goto(SIGNIN, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector('input[name="email"]', { visible: true })
  await page.type('input[name="email"]', EMAIL, { delay: 15 })
  await page.type('input[name="password"]', PASSWORD, { delay: 15 })
  await clickByText('button', 'เข้าสู่ระบบ')
  await page.waitForFunction(() => !location.pathname.includes('/auth/sign-in'), { timeout: 25000 })
  await sleep(1500)

  const campaignName = `คู่มือคูปอง ${Date.now()}`
  const itemCode = `MANUAL${Math.floor(10000 + Math.random() * 90000)}`

  // ---------- หน้ารายการ ----------
  console.log('list...')
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await waitText('คูปอง')
  await waitNoSkeleton()
  await sleep(1200)
  await shot('01-list')

  await page.waitForSelector('input[placeholder="ค้นหาชื่อคูปอง"]', { visible: true })
  await page.type('input[placeholder="ค้นหาชื่อคูปอง"]', 'คู่มือ', { delay: 20 })
  await sleep(1600)
  await shot('02-search')
  const search = await page.$('input[placeholder="ค้นหาชื่อคูปอง"]')
  await search.click({ clickCount: 3 })
  await search.press('Backspace')
  await sleep(800)

  await clickByText('button', 'ตัวกรอง')
  await page.waitForSelector('[role="dialog"]', { visible: true })
  await sleep(700)
  await shot('03-filter-dialog')
  await page.keyboard.press('Escape')
  await sleep(700)

  // ---------- หน้าสร้างแคมเปญ ----------
  console.log('create...')
  await clickByText('button', 'เพิ่มคูปอง')
  await page.waitForFunction(() => location.pathname.includes('/coupons/create'), { timeout: 15000 })
  await waitText('เพิ่มแคมเปญคูปอง')
  await sleep(1000)
  await shot('04-create-overview')

  await typeIn('translations.0.name', campaignName)
  await sleep(500)
  await shot('05-create-basic-filled')

  await clickByText('label', 'ไม่มีวันหมดอายุ')
  await sleep(500)
  await shot('06-create-duration')

  await waitText('ยังไม่มีรายการคูปอง')
  await shot('07-create-items-empty')

  // ---------- Dialog เพิ่มรายการคูปอง ----------
  console.log('item dialog...')
  await clickByText('button', 'เพิ่มรายการคูปอง')
  await page.waitForSelector('[role="dialog"][data-state="open"]', { visible: true })
  await sleep(1000)
  await shot('08-item-dialog-overview')

  // validation ฟอร์มเปล่า
  await clickByText('button', 'ยืนยัน', '[role="dialog"][data-state="open"]')
  await waitText('กรุณากรอกรหัสคูปอง')
  await sleep(400)
  await shot('09-item-validation')

  // กรอกข้อมูลรายการคูปอง
  await typeIn('translations.0.name', 'รายการคูปองคู่มือ', '[role="dialog"][data-state="open"]')
  await typeIn('discountValue', '10', '[role="dialog"][data-state="open"]')
  await sleep(400)
  await shot('10-item-filled')

  // สร้างรหัสอัตโนมัติ
  await clickByText('label', 'สร้างรหัสอัตโนมัติ', '[role="dialog"][data-state="open"]')
  await waitText('คำนำหน้ารหัส')
  await sleep(400)
  await shot('11-item-auto-code')

  // กลับเป็นรหัสเดียว + กรอกรหัส
  await clickByText('label', 'รหัสเดียว', '[role="dialog"][data-state="open"]')
  await sleep(300)
  await typeIn('code', itemCode, '[role="dialog"][data-state="open"]')

  // เลือกเฉพาะสินค้าที่ต้องการ
  await clickByText('label', 'เลือกเฉพาะสินค้าที่ต้องการ', '[role="dialog"][data-state="open"]')
  await sleep(700)
  await shot('12-item-product-scope')

  // กลับเป็นใช้กับสินค้าทั้งหมด
  await clickByText('label', 'ใช้กับสินค้าทั้งหมด', '[role="dialog"][data-state="open"]')
  await sleep(400)

  // ยืนยัน → รายการเข้าตาราง
  await clickByText('button', 'ยืนยัน', '[role="dialog"][data-state="open"]')
  await page.waitForFunction(() => !document.querySelector('[role="dialog"][data-state="open"]'), { timeout: 12000 })
  await waitText(itemCode)
  await sleep(600)
  await shot('13-item-in-table')

  // ---------- บันทึก + verify ----------
  console.log('save...')
  await clickByText('button', 'บันทึก')
  await page.waitForFunction(() => /\/coupons\/?$/.test(location.pathname), { timeout: 25000 })
  await waitText('คูปอง')
  await waitNoSkeleton()
  await page.waitForSelector('input[placeholder="ค้นหาชื่อคูปอง"]', { visible: true })
  await page.type('input[placeholder="ค้นหาชื่อคูปอง"]', campaignName, { delay: 15 })
  await sleep(2000)
  await shot('14-list-after-save')

  await browser.close()
  console.log('DONE. campaign:', campaignName, '| code:', itemCode)
}

main().catch((err) => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
