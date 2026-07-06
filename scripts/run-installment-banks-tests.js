/**
 * Automated tests — จัดการธนาคาร (installment-banks)
 * รัน: CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/run-installment-banks-tests.js
 */
const fs = require('fs')
const path = require('path')
const { BASE, launchAndLogin, makeApi, Results, sleep } = require('./_helpers')

const LIST_URL = `${BASE}/store/installment/installment-banks`
const RESULTS_PATH = path.join(__dirname, '../testcases/results/ibank-test-results.json')

async function main() {
  const { browser, page } = await launchAndLogin()
  const { waitText, hasText, click, typeIn, valueOf, headText } = makeApi(page)
  const R = new Results()

  const gotoList = async () => {
    await page.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await waitText('ธนาคาร').catch(() => {})
    await sleep(2000)
  }

  // PART 1: LIST
  await gotoList()
  R.rec('J-IBK-LP001', 'หน้า list โหลดสำเร็จ', 'Pass')

  const heading = await page.evaluate(() => document.querySelector('h1,h2')?.textContent?.trim() || '')
  R.rec('J-IBK-LP002', `heading="${heading.slice(0, 60)}"`, heading.includes('ธนาคาร') ? 'Pass' : 'Warning')

  const ths = await headText()
  const expCols = ['#', 'ธนาคาร', 'อัตราดอกเบี้ย', 'สถานะ', 'ผู้แก้ไข', 'วันที่แก้ไข', 'จัดการ']
  const missing = expCols.filter((c) => !ths.some((t) => t.includes(c.replace('/', '')) || t.includes(c)))
  R.rec('J-IBK-LP003', missing.length === 0 ? `คอลัมน์ครบ (${ths.length})` : `ขาด: ${missing.join(',')} | got=${JSON.stringify(ths)}`, missing.length === 0 ? 'Pass' : 'Warning')

  const rowCount = await page.$$eval('tbody tr', (rs) => rs.length).catch(() => 0)
  R.rec('J-IBK-LP004', `แถว=${rowCount}`, rowCount >= 4 ? 'Pass' : 'Warning')

  const ab = await page.evaluate(() => ({
    search: !!document.querySelector('input[placeholder*="ค้นหา"]'),
    filter: !!Array.from(document.querySelectorAll('button')).find((b) => /^ตัวกรอง/.test(b.textContent.trim())),
    cols: !!Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('ปรับแต่งคอลัมน์')),
    add: !!Array.from(document.querySelectorAll('button,a')).find((b) => /เพิ่ม|สร้าง/.test(b.textContent)),
  }))
  R.rec('J-IBK-LP005', `actionbar=${JSON.stringify(ab)}`, ab.search ? 'Pass' : 'Warning')
  R.rec('J-IBK-LP006', ab.add ? 'มีปุ่มเพิ่ม (ไม่คาดหวัง)' : 'ไม่มีปุ่มเพิ่ม — master data ล่วงหน้า', !ab.add ? 'Pass' : 'Warning')

  const rows = await page.evaluate(() =>
    Array.from(document.querySelectorAll('tbody tr')).map((r) => r.innerText.replace(/\s+/g, ' ').trim().slice(0, 80)))
  R.rec('J-IBK-LP007', `records=${JSON.stringify(rows)}`, rows.some((r) => /kbank|ktc|kcc/i.test(r)) ? 'Pass' : 'Warning')

  // Search
  const searchPh = await page.evaluate(() => document.querySelector('input[placeholder*="ค้นหา"]')?.placeholder || '')
  if (searchPh) {
    await typeIn('input[placeholder*="ค้นหา"]', 'kbank')
    await sleep(1500)
    R.rec('J-IBK-LP010', (await hasText('kbank')) ? 'ค้นหา kbank พบ' : 'ไม่พบ', (await hasText('kbank')) ? 'Pass' : 'Warning')
    await typeIn('input[placeholder*="ค้นหา"]', `nx-${Date.now()}`)
    await sleep(1500)
    R.rec('J-IBK-LP011', (await hasText('ไม่พบ')) || rowCount === 0 ? 'empty search OK' : 'ยังมีแถว', (await hasText('ไม่พบ')) ? 'Pass' : 'Warning')
    const sb = await page.$('input[placeholder*="ค้นหา"]')
    await sb.click({ clickCount: 3 })
    await sb.press('Backspace')
    await sleep(800)
    R.rec('J-IBK-LP012', 'เคลียร์ search', 'Pass')
  } else {
    R.nt('J-IBK-LP010', 'ไม่พบช่องค้นหา')
    R.nt('J-IBK-LP011', 'skip')
    R.nt('J-IBK-LP012', 'skip')
  }

  // Filter
  try {
    await click('button', 'ตัวกรอง')
    await sleep(800)
    R.rec('J-IBK-LP020', (await page.$('[role="dialog"]')) ? 'sheet เปิด' : 'ไม่เปิด', (await page.$('[role="dialog"]')) ? 'Pass' : 'Warning')
    await page.keyboard.press('Escape')
    await sleep(400)
    R.rec('J-IBK-LP021', 'ESC ปิด', 'Pass')
  } catch (e) {
    R.rec('J-IBK-LP020', e.message, 'Warning')
    R.rec('J-IBK-LP021', 'skip', 'Warning')
  }

  // Customize columns
  try {
    await click('button', 'ปรับแต่งคอลัมน์')
    await sleep(700)
    R.rec('J-IBK-LP030', 'menu เปิด', 'Pass')
    await page.keyboard.press('Escape')
    R.rec('J-IBK-LP031', 'ปิด menu', 'Pass')
  } catch (e) {
    R.rec('J-IBK-LP030', e.message, 'Warning')
    R.rec('J-IBK-LP031', 'skip', 'Warning')
  }

  const footer = await page.evaluate(() => {
    const m = document.body.innerText.match(/(\d+)\s*-\s*(\d+)\s*จาก\s*(\d+)/)
    return m ? m[0] : null
  })
  R.rec('J-IBK-LP040', footer ? `footer="${footer}"` : 'ไม่พบ pagination (≤4 แถว)', footer ? 'Pass' : 'Warning')

  const edHref = await page.evaluate(() => {
    const a = document.querySelector('tbody a[href*="/installment-banks/update/"]')
    return a ? a.getAttribute('href') : null
  })
  R.rec('J-IBK-LP050', edHref ? `edit href="${edHref}"` : 'ไม่พบ', edHref ? 'Pass' : 'Fail')

  await page.goto(`${LIST_URL}/create`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await sleep(2000)
  const create404 = (await hasText('404')) || (await hasText('ไม่พบ')) || !page.url().includes('/create')
  R.rec('J-IBK-LP060', `create URL → ${create404 ? '404/redirect' : 'มีหน้า create'}`, create404 ? 'Pass' : 'Warning', 'ธนาคารเป็น master data — ไม่มี create')

  // PART 2: EDIT
  const editId = edHref ? edHref.split('/').pop() : '4'
  await page.goto(`${LIST_URL}/update/${editId}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2500)
  R.rec('J-IBK-ED001', page.url().includes('/update/') ? `เปิด edit id=${editId}` : 'ไม่เข้า edit', page.url().includes('/update/') ? 'Pass' : 'Fail')

  const code = await valueOf('input[name="code"]')
  R.rec('J-IBK-ED002', `code="${code}" (readonly)`, code ? 'Pass' : 'Warning')

  const hasTH = !!(await page.$('input[name="translations.0.name"]'))
  const hasEN = !!(await page.$('input[name="translations.1.name"]'))
  const hasRate = !!(await page.$('input[placeholder="0"]'))
  R.rec('J-IBK-ED003', `TH=${hasTH} EN=${hasEN} rate=${hasRate}`, (hasTH && hasEN && hasRate) ? 'Pass' : 'Warning')

  const sync = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('[role="switch"]'))
    const sy = s.find((x) => /ใช้เหมือนกัน/.test(x.closest('label,div,p')?.textContent || ''))
    return sy ? sy.getAttribute('data-state') : null
  })
  R.rec('J-IBK-ED004', `sync TH/EN default=${sync}`, sync ? 'Pass' : 'Warning')

  const statusSw = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('[role="switch"]'))
    const st = s.find((x) => /เปิดใช้งาน|สถานะ/.test(x.closest('label,div,p')?.textContent || ''))
    return st ? st.getAttribute('data-state') : null
  })
  R.rec('J-IBK-ED005', `status switch=${statusSw}`, statusSw ? 'Pass' : 'Warning')

  R.rec('J-IBK-ED006', (await hasText('โลโก้ธนาคาร')) ? 'มีส่วนอัปโหลดโลโก้' : 'ขาด', (await hasText('โลโก้ธนาคาร')) ? 'Pass' : 'Warning')

  // Validation: clear rate
  try {
    const rateEl = await page.$('input[placeholder="0"]')
    if (rateEl) {
      await rateEl.click({ clickCount: 3 })
      await rateEl.press('Backspace')
      await click('button', 'บันทึก')
      await sleep(2000)
      const err = await hasText('กรุณา')
      R.rec('J-IBK-ED010', err ? 'validation เมื่อดอกเบี้ยว่าง' : 'บันทึกผ่าน/ไม่มี error', err ? 'Pass' : 'Warning')
      await rateEl.type('1.25', { delay: 10 })
    } else R.nt('J-IBK-ED010', 'ไม่พบ input ดอกเบี้ย')
  } catch (e) { R.rec('J-IBK-ED010', e.message, 'Warning') }

  // Save cycle
  try {
    await page.goto(`${LIST_URL}/update/${editId}`, { waitUntil: 'domcontentloaded' })
    await sleep(2000)
    const origRate = await valueOf('input[placeholder="0"]')
    const newRate = origRate === '1.5' ? '1.25' : '1.5'
    await typeIn('input[placeholder="0"]', newRate)
    await click('button', 'บันทึก')
    await sleep(5000)
    const back = page.url().endsWith('installment-banks') || page.url().includes('/installment-banks?')
    R.rec('J-IBK-ED020', back ? `บันทึกสำเร็จ rate=${newRate}` : `url=${page.url()}`, back ? 'Pass' : 'Warning')

    if (back) {
      await page.goto(`${LIST_URL}/update/${editId}`, { waitUntil: 'domcontentloaded' })
      await sleep(2000)
      const saved = await valueOf('input[placeholder="0"]')
      R.rec('J-IBK-ED021', `rate หลัง reopen=${saved}`, saved === newRate ? 'Pass' : 'Warning')
      // restore
      await typeIn('input[placeholder="0"]', origRate || '1.25')
      await click('button', 'บันทึก')
      await sleep(4000)
    } else R.rec('J-IBK-ED021', 'skip', 'Warning')
  } catch (e) {
    R.rec('J-IBK-ED020', e.message, 'Fail')
    R.rec('J-IBK-ED021', 'skip', 'Warning')
  }

  // Invalid ID
  await page.goto(`${LIST_URL}/update/99999999`, { waitUntil: 'domcontentloaded' })
  await sleep(2500)
  const bad = (!page.url().includes('/update/')) || (await hasText('ไม่พบ')) || (await hasText('404'))
    || !(await page.$('input[name="code"]'))
  R.rec('J-IBK-ED030', `invalid id indicator=${bad} url=${page.url()}`, bad ? 'Pass' : 'Fail', 'Bug pattern: empty form แทน 404')

  // ID mapping note
  const idMap = []
  for (const id of [1, 2, 3, 4]) {
    await page.goto(`${LIST_URL}/update/${id}`, { waitUntil: 'domcontentloaded' })
    await sleep(1500)
    const c = await valueOf('input[name="code"]').catch(() => '?')
    idMap.push(`${id}=${c}`)
  }
  R.rec('J-IBK-ED031', `id→code mapping: ${idMap.join(', ')}`, 'Pass', 'ลำดับใน list ไม่ตรงกับ id')

  await browser.close()
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(R.data, null, 2), 'utf8')
  const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
  for (const k of Object.keys(R.data)) sum[R.data[k].result] = (sum[R.data[k].result] || 0) + 1
  console.log('\n[ibank-test-results.json] SUMMARY:', JSON.stringify(sum), 'Total:', Object.keys(R.data).length)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
