/**
 * จับภาพหน้าจอ flow กลุ่มตัวเลือก Mapping (Template Options) สำหรับคู่มือผู้ใช้ ด้วย Puppeteer
 * รัน: CHROME="<path>" node scripts/capture-template-options-screenshots.js
 * ผลลัพธ์: docs/images/template-options/NN-*.png
 */
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const BASE = 'https://devstorex.jibc.codelabdev.co'
const SIGNIN = `${BASE}/auth/sign-in`
const LIST_URL = `${BASE}/store/product-manager/template-options`
const CREATE_URL = `${LIST_URL}/create`
const OUT_DIR = path.join(__dirname, '../docs/images/template-options')
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
  const clickOption = async (text) => {
    await page.waitForSelector('[role="option"]', { visible: true, timeout: 6000 })
    await clickByText('[role="option"]', text)
  }
  const openTypeCombo = async () => {
    // ประเภท combobox บนหน้า create (มี combobox เดียว)
    await clickByText('[role="combobox"]', '')
  }
  const typeIn = async (name, value, rootSel = null) => {
    const sel = `${rootSel ? rootSel + ' ' : ''}input[name="${name}"], ${rootSel ? rootSel + ' ' : ''}textarea[name="${name}"]`
    await page.waitForSelector(sel, { visible: true })
    const el = await page.$(sel)
    await el.click({ clickCount: 3 })
    await el.press('Backspace')
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

  const groupName = `คู่มือกลุ่มตัวเลือก ${Date.now()}`

  // ---- LIST ----
  console.log('list...')
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await waitText('กลุ่มตัวเลือก Mapping')
  await waitNoSkeleton()
  await sleep(1500)
  await shot('01-list')

  await page.waitForSelector('input[placeholder="ค้นหา"]', { visible: true })
  await page.type('input[placeholder="ค้นหา"]', 'GPU', { delay: 25 })
  await sleep(1600)
  await shot('02-search')
  const s = await page.$('input[placeholder="ค้นหา"]')
  await s.click({ clickCount: 3 }); await s.press('Backspace')
  await sleep(800)

  // ตัวกรองประเภท (dropdown)
  try {
    await clickByText('button', 'ประเภท')
    await sleep(700)
    await shot('03-filter-type')
    await page.keyboard.press('Escape'); await sleep(500)
  } catch (e) { console.log('skip 03:', e.message) }

  // ปรับแต่งคอลัมน์
  try {
    await clickByText('button', 'ปรับแต่งคอลัมน์')
    await sleep(700)
    await shot('04-customize-columns')
    await page.keyboard.press('Escape'); await sleep(500)
  } catch (e) { console.log('skip 04:', e.message) }

  // ---- CREATE ----
  console.log('create...')
  await page.goto(CREATE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await waitText('เพิ่มกลุ่มตัวเลือก')
  await sleep(1200)
  await shot('05-create-overview')

  // เปิด dropdown ประเภท
  try {
    await openTypeCombo()
    await page.waitForSelector('[role="option"]', { visible: true, timeout: 6000 })
    await sleep(500)
    await shot('06-type-dropdown')
    // เลือก ตัวเลข
    await clickOption('ตัวเลข')
    await sleep(800)
    await shot('07-type-number')
    // เลือก ใช่/ไม่ใช่
    await openTypeCombo()
    await clickOption('ใช่')
    await sleep(800)
    await shot('08-type-yesno')
    // กลับเป็น ข้อความ
    await openTypeCombo()
    await clickOption('ข้อความ')
    await sleep(800)
  } catch (e) { console.log('type variations issue:', e.message); await page.keyboard.press('Escape') }

  // กรอกข้อมูล (ข้อความ)
  await typeIn('name', groupName)
  await typeIn('description', 'กลุ่มตัวเลือกสำหรับคู่มือ Mapping')
  await typeIn('options.0.value', 'AM5')
  try {
    await clickByText('button', 'เพิ่มตัวเลือก')
    await sleep(500)
    await typeIn('options.1.value', 'AM4')
  } catch (e) { console.log('add option issue:', e.message) }
  await sleep(500)
  await shot('09-create-text-filled')

  // ---- SAVE ----
  console.log('save...')
  try {
    await clickByText('button', 'บันทึก')
    await page.waitForFunction(() => /\/template-options\/?$/.test(location.pathname), { timeout: 20000 })
    await waitText('กลุ่มตัวเลือก Mapping')
    await waitNoSkeleton()
    await page.waitForSelector('input[placeholder="ค้นหา"]', { visible: true })
    await page.type('input[placeholder="ค้นหา"]', groupName, { delay: 12 })
    await sleep(2000)
    await shot('10-list-after-save')
  } catch (e) { console.log('save issue:', e.message); await shot('10-list-after-save') }

  await browser.close()
  console.log('DONE. group:', groupName)
}
main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
