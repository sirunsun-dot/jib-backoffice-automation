/**
 * Live smoke verification ทุกฟังก์ชัน Backoffice (ครบตาม Sidebar)
 * รัน: node scripts/verify-all-modules-live.js
 */
const fs = require('fs')
const path = require('path')
const { launchAndLogin, makeApi, sleep } = require('./_helpers')
const { MODULES } = require('./modules-config')

const LIVE_JSON = path.join(__dirname, '../testcases/results/live-verify-results.json')

async function inspectListPage(page, mod) {
  await page.goto(mod.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2500)

  const body = await page.evaluate(() => document.body?.innerText || '')
  const url = page.url()

  if (url.includes('/auth/sign-in')) {
    return { status: 'Fail', checks: { login: false }, note: 'ถูก redirect กลับ login' }
  }
  if (body.includes('403') || body.includes('ไม่มีสิทธิ์') || body.includes('Access Denied')) {
    return { status: 'Fail', checks: { permission: false }, note: 'ไม่มีสิทธิ์เข้าหน้านี้' }
  }
  if (body.includes('404') && body.includes('could not be found')) {
    return { status: 'Fail', checks: { notFound: true }, note: 'หน้า 404 — URL อาจย้ายหรือถูกลบ' }
  }

  const info = await page.evaluate((headingHint) => {
    const bodyText = document.body?.innerText || ''
    const hasHeading = bodyText.includes(headingHint)
      || Array.from(document.querySelectorAll('h1,h2,h3,p,span')).some((e) => (e.textContent || '').includes(headingHint))
    const table = document.querySelector('table')
    const rows = table ? table.querySelectorAll('tbody tr').length : 0
    const hasUndefined = bodyText.includes('undefined')
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="ค้นหา"], input[placeholder*="search" i]')
    const buttons = Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim())
    const hasFilter = buttons.some((b) => b.includes('ตัวกรอง'))
    const hasAdd = buttons.some((b) => /เพิ่ม|สร้าง|Add/i.test(b))
    const hasCols = buttons.some((b) => b.includes('ปรับแต่งคอลัมน์'))
    const pagination = bodyText.match(/\d+\s*-\s*\d+\s*จาก\s*\d+/) !== null
    const emptyState = bodyText.includes('ไม่พบ') || bodyText.includes('ยังไม่มี') || bodyText.includes('0 รายการ')
    const hasForm = document.querySelectorAll('input, textarea, [role="combobox"]').length > 0
    return { hasHeading, rows, hasUndefined, hasSearch: !!searchInput, hasFilter, hasAdd, hasCols, pagination, emptyState, hasForm, title: document.title }
  }, mod.heading)

  const checks = []
  if (!info.hasHeading && !info.hasForm && info.rows === 0) checks.push('ไม่พบ heading/ตาราง/ฟอร์ม')
  if (info.hasUndefined) checks.push("พบ 'undefined'")
  if (!info.hasSearch && !info.hasForm && mod.createUrl) checks.push('ไม่พบช่องค้นหา')
  if (!info.hasAdd && mod.createUrl && info.rows >= 0) checks.push('ไม่พบปุ่มเพิ่ม')

  let status = 'Pass'
  if (checks.some((c) => c.includes('undefined') || c.includes('404') || c.includes('สิทธิ์'))) status = 'Fail'
  else if (checks.length > 0) status = 'Warning'
  else if (info.rows === 0 && !info.emptyState && !info.hasForm) status = 'Warning'

  return {
    status,
    checks: { ...info, heading: info.hasHeading, tableRows: info.rows },
    note: checks.length ? checks.join('; ') : `โหลดสำเร็จ — ${info.rows} แถว`,
    title: info.title,
  }
}

async function inspectCreatePage(page, mod) {
  if (!mod.createUrl) return null
  await page.goto(mod.createUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2000)

  const info = await page.evaluate(() => {
    const bodyText = document.body?.innerText || ''
    if (bodyText.includes('404') && bodyText.includes('could not be found')) return { is404: true, inputs: 0, saveBtn: false }
    const inputs = document.querySelectorAll('input, textarea, [role="combobox"]').length
    const saveBtn = Array.from(document.querySelectorAll('button')).some((b) => (b.textContent || '').includes('บันทึก'))
    const isCreate = /เพิ่ม|สร้าง|Create/i.test(bodyText)
    return { inputs, saveBtn, isCreate, is404: false, url: location.pathname }
  })

  if (info.is404) return { status: 'Fail', checks: info, note: 'หน้า Create 404' }

  let status = 'Pass'
  const issues = []
  if (info.inputs < 2) issues.push(`input น้อย (${info.inputs})`)
  if (!info.saveBtn) issues.push('ไม่พบปุ่มบันทึก')
  if (!info.isCreate) issues.push('ไม่พบข้อความ เพิ่ม/สร้าง')
  if (issues.length >= 2) status = 'Fail'
  else if (issues.length > 0) status = 'Warning'

  return { status, checks: info, note: issues.length ? issues.join('; ') : 'Create โหลดสำเร็จ' }
}

async function inspectInvalidEdit(page, mod) {
  if (!mod.createUrl) return null
  const invalidUrl = mod.createUrl.replace('/create', '/update/99999999')
  await page.goto(invalidUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2000)

  const info = await page.evaluate(() => {
    const bodyText = document.body?.innerText || ''
    const is404 = bodyText.includes('404') && bodyText.includes('could not be found')
    const isCreateLike = /เพิ่ม|สร้าง/i.test(bodyText.slice(0, 300)) && !/แก้ไข/i.test(bodyText.slice(0, 200))
    const emptyForm = document.querySelectorAll('input[name], textarea[name]').length === 0
    return { is404, isCreateLike, emptyForm, path: location.pathname }
  })

  let status = 'Pass'
  let note = 'Invalid ID → 404/redirect ถูกต้อง'
  if (!info.is404 && info.isCreateLike) { status = 'Fail'; note = 'Invalid ID แสดงหน้า Create แทน 404' }
  else if (!info.is404 && info.emptyForm) { status = 'Warning'; note = 'Invalid ID ฟอร์มว่าง' }

  return { status, checks: info, note }
}

async function main() {
  const started = new Date().toISOString()
  console.log(`🔍 Live verify ${MODULES.length} modules —`, started)
  const { browser, page } = await launchAndLogin()
  const results = { started, account: 'sirun.sun@codelabdev.co', totalModules: MODULES.length, modules: {} }

  const postLoginUrl = page.url()
  results.modules.LOGIN = {
    name: 'เข้าสู่ระบบ (Login)', group: 'ทั่วไป', url: MODULES.find((m) => m.id === 'LOGIN').url,
    list: { status: postLoginUrl.includes('/auth/sign-in') ? 'Fail' : 'Pass', note: `→ ${postLoginUrl}` },
    overall: postLoginUrl.includes('/auth/sign-in') ? 'Fail' : 'Pass',
  }
  console.log('LOGIN:', results.modules.LOGIN.overall)

  for (const mod of MODULES.filter((m) => m.id !== 'LOGIN')) {
    process.stdout.write(`${mod.id}... `)
    const entry = { name: mod.name, group: mod.group, sidebar: mod.sidebar, url: mod.url, list: null, create: null, invalidEdit: null, overall: 'Pass', issues: [] }

    try {
      entry.list = await inspectListPage(page, mod)
      if (entry.list.status !== 'Pass') entry.issues.push(`List: ${entry.list.note}`)

      entry.create = await inspectCreatePage(page, mod)
      if (entry.create && entry.create.status !== 'Pass') entry.issues.push(`Create: ${entry.create.note}`)

      entry.invalidEdit = await inspectInvalidEdit(page, mod)
      if (entry.invalidEdit && entry.invalidEdit.status !== 'Pass') entry.issues.push(`InvalidEdit: ${entry.invalidEdit.note}`)

      const statuses = [entry.list?.status, entry.create?.status, entry.invalidEdit?.status].filter(Boolean)
      if (statuses.includes('Fail')) entry.overall = 'Fail'
      else if (statuses.includes('Warning')) entry.overall = 'Warning'
    } catch (e) {
      entry.overall = 'Fail'
      entry.error = e.message
      entry.issues.push(e.message)
    }

    results.modules[mod.id] = entry
    console.log(entry.overall)
  }

  results.finished = new Date().toISOString()
  const sum = { Pass: 0, Warning: 0, Fail: 0, 'Not Tested': 0 }
  for (const k of Object.keys(results.modules)) sum[results.modules[k].overall]++
  results.summary = sum

  fs.writeFileSync(LIVE_JSON, JSON.stringify(results, null, 2), 'utf8')
  console.log('\n✅', LIVE_JSON, '|', JSON.stringify(sum))
  await browser.close()
}

main().catch((e) => { console.error('FATAL', e); process.exit(1) })
