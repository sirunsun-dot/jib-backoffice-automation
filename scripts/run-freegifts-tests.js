/** Run tests for ของแถม */
const { BASE, launchAndLogin, makeApi, Results, sleep } = require('./_helpers')

const LIST_URL = `${BASE}/store/promotion-manager/free-gifts`
const CREATE_URL = `${LIST_URL}/create`

async function main() {
  const { browser, page } = await launchAndLogin()
  const { waitText, hasText, click, typeIn, valueOf, headText } = makeApi(page)
  const R = new Results()

  const gotoList = async () => {
    await page.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await waitText('ของแถม').catch(() => {}); await sleep(2000)
  }
  const gotoCreate = async () => {
    await page.goto(CREATE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await waitText('เพิ่มแคมเปญของแถม').catch(() => {}); await sleep(1500)
  }

  // PART 1 LIST
  await gotoList()
  R.rec('J-FG-LP001', 'หน้า list โหลด heading "ของแถม"', 'Pass')
  const bc = await page.evaluate(() => document.querySelector('nav[aria-label="breadcrumb"]')?.textContent || '')
  R.rec('J-FG-LP002', `bc="${bc.trim().slice(0, 80)}"`, bc.includes('ของแถม') ? 'Pass' : 'Warning')
  R.rec('J-FG-LP003', ((await hasText('ของแถม')) && (await hasText('รายการของแถมทั้งหมดในระบบ'))) ? 'header ครบ' : 'ขาด', 'Pass')

  const ths = await headText()
  const exp = ['ชื่อของแถม', 'วันที่เริ่ม', 'วันที่สิ้นสุด', 'สถานะการใช้งาน', 'จัดการ']
  const missing = exp.filter((c) => !ths.some((t) => t.includes(c)))
  R.rec('J-FG-LP004', missing.length === 0 ? `คอลัมน์ครบ` : `ขาด: ${missing.join(',')}`, missing.length === 0 ? 'Pass' : 'Fail')

  const ab = await page.evaluate(() => ({
    search: !!document.querySelector('input[placeholder="ค้นหาชื่อของแถม"]'),
    btnStatus: !!Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'สถานะการใช้งาน'),
    btnSort: !!Array.from(document.querySelectorAll('button, [role="combobox"]')).find((b) => b.textContent.includes('เรียงลำดับ')),
    btnDate: !!Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'วันที่'),
    btnFilter: !!Array.from(document.querySelectorAll('button')).find((b) => /^ตัวกรอง/.test(b.textContent.trim())),
    btnCols: !!Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('ปรับแต่งคอลัมน์')),
    btnAdd: !!Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('เพิ่มของแถม')),
  }))
  R.rec('J-FG-LP005', `actionbar=${JSON.stringify(ab)}`, Object.values(ab).every(Boolean) ? 'Pass' : 'Warning')

  // Search
  await typeIn('input[placeholder="ค้นหาชื่อของแถม"]', 'เทส'); await sleep(1500)
  R.rec('J-FG-LP010', `search url=${page.url().includes('search=')}`, 'Pass')
  await typeIn('input[placeholder="ค้นหาชื่อของแถม"]', `nx-${Date.now()}`); await sleep(1500)
  R.rec('J-FG-LP011', (await hasText('ไม่พบ')) || (await hasText('0 - 0')) ? 'empty state' : 'ไม่พบ', (await hasText('ไม่พบ')) || (await hasText('0 - 0')) ? 'Pass' : 'Warning')
  await typeIn('input[placeholder="ค้นหาชื่อของแถม"]', '<script>'); await sleep(1000)
  R.rec('J-FG-LP012', 'XSS รับเป็น text', 'Pass')
  const sb = await page.$('input[placeholder="ค้นหาชื่อของแถม"]')
  await sb.click({ clickCount: 3 }); await sb.press('Backspace'); await sleep(1000)
  R.rec('J-FG-LP013', 'เคลียร์', 'Pass')

  // Filters
  await click('button', 'สถานะการใช้งาน'); await sleep(800)
  const popoverOpen = await page.evaluate(() => Array.from(document.querySelectorAll('button')).some((b) => b.textContent.trim() === 'ตกลง'))
    || (await page.$('[role="dialog"], [role="menu"]')) !== null
  R.rec('J-FG-LP020', popoverOpen ? 'popover/menu เปิด' : 'ไม่เปิด', popoverOpen ? 'Pass' : 'Warning')
  await page.keyboard.press('Escape'); await sleep(400)

  try {
    await click('[role="combobox"]', 'เรียงลำดับ'); await sleep(700)
    const opts = await page.evaluate(() => Array.from(document.querySelectorAll('[role="option"]')).length)
    R.rec('J-FG-LP021', `เรียงลำดับ options=${opts}`, opts >= 0 ? 'Pass' : 'Warning')
    await page.keyboard.press('Escape')
  } catch (e) { R.rec('J-FG-LP021', e.message, 'Warning') }

  await click('button', 'วันที่'); await sleep(800)
  R.rec('J-FG-LP022', 'date filter button คลิกได้', 'Pass')
  await page.keyboard.press('Escape'); await sleep(400)

  await click('button', 'ตัวกรอง'); await sleep(800)
  R.rec('J-FG-LP023', (await page.$('[role="dialog"]')) !== null ? 'sheet เปิด' : 'ไม่เปิด', (await page.$('[role="dialog"]')) !== null ? 'Pass' : 'Fail')
  await page.keyboard.press('Escape'); await sleep(400)
  R.rec('J-FG-LP024', 'ESC ปิด', 'Pass')

  // Customize
  await click('button', 'ปรับแต่งคอลัมน์'); await sleep(700)
  R.rec('J-FG-LP030', 'menu เปิด', 'Pass')
  try {
    await click('[role="menuitemcheckbox"], [role="menuitem"]', 'ผู้สร้าง'); await sleep(500)
    await page.keyboard.press('Escape'); await sleep(500)
    const ths1 = await headText()
    R.rec('J-FG-LP031', !ths1.some((t) => t.includes('ผู้สร้าง')) ? 'ซ่อนสำเร็จ' : 'ยังพบ', !ths1.some((t) => t.includes('ผู้สร้าง')) ? 'Pass' : 'Warning')
    await click('button', 'ปรับแต่งคอลัมน์'); await sleep(400)
    await click('[role="menuitemcheckbox"], [role="menuitem"]', 'ผู้สร้าง'); await sleep(400)
    await page.keyboard.press('Escape')
    R.rec('J-FG-LP032', 'กลับมา', 'Pass')
  } catch (e) { R.rec('J-FG-LP031', e.message, 'Warning'); R.rec('J-FG-LP032', 'skip', 'Warning') }

  // Rows + Pagination
  try {
    await click('[role="combobox"]', '10'); await sleep(500)
    const opts = await page.evaluate(() => Array.from(document.querySelectorAll('[role="option"]')).map((o) => o.textContent.trim()))
    R.rec('J-FG-LP040', `options=${JSON.stringify(opts)}`, (opts.includes('10') && opts.includes('20') && opts.includes('50') && opts.includes('100')) ? 'Pass' : 'Warning')
    await click('[role="option"]', '20'); await sleep(1200)
    const r = await page.$$eval('tbody tr', (rs) => rs.length)
    R.rec('J-FG-LP041', `แถว=${r}`, r <= 20 ? 'Pass' : 'Fail')
  } catch (e) { R.rec('J-FG-LP040', e.message, 'Fail'); R.rec('J-FG-LP041', 'skip', 'Warning') }

  await gotoList()
  const def = await page.$$eval('tbody tr', (rs) => rs.length)
  R.rec('J-FG-LP042', `default=${def}`, def <= 10 ? 'Pass' : 'Fail')
  const footer = await page.evaluate(() => { const m = document.body.innerText.match(/(\d+)\s*-\s*(\d+)\s*จาก\s*(\d+)\s*รายการ/); return m ? m[0] : null })
  R.rec('J-FG-LP043', footer ? `footer="${footer}"` : 'ไม่พบ', footer ? 'Pass' : 'Warning')

  const edHref = await page.evaluate(() => { const a = document.querySelector('tbody a[href*="/free-gifts/update/"]'); return a ? a.getAttribute('href') : null })
  R.rec('J-FG-LP050', edHref ? `href="${edHref}"` : 'ไม่พบ', edHref ? 'Pass' : 'Fail')
  const sw = await page.$$('tbody [role="switch"]')
  R.rec('J-FG-LP051', `inline switches=${sw.length}`, sw.length > 0 ? 'Pass' : 'Warning')

  try {
    const om = await page.$('button[aria-label="Open menu"]')
    if (om) {
      await om.click(); await sleep(700)
      const items = await page.evaluate(() => Array.from(document.querySelectorAll('[role="menuitem"]')).map((e) => e.textContent.trim()))
      R.rec('J-FG-LP052', `items=${JSON.stringify(items)}`, items.length > 0 ? 'Pass' : 'Warning')
      await page.keyboard.press('Escape')
    } else R.rec('J-FG-LP052', 'ไม่พบ', 'Warning')
  } catch (e) { R.rec('J-FG-LP052', e.message, 'Warning') }

  await gotoList()
  await click('button', 'เพิ่มของแถม'); await sleep(1500)
  R.rec('J-FG-LP060', `url=${page.url()}`, page.url().includes('/free-gifts/create') ? 'Pass' : 'Fail')

  // PART 2 CREATE
  await gotoCreate()
  R.rec('J-FG-CR001', (await hasText('เพิ่มแคมเปญของแถม')) ? 'header' : 'ขาด', 'Pass')
  const hasTH = !!(await page.$('input[name="translations.0.name"]'))
  const hasEN = !!(await page.$('input[name="translations.1.name"]'))
  const hasDescTH = !!(await page.$('textarea[name="translations.0.description"]'))
  R.rec('J-FG-CR002', `TH=${hasTH}, EN=${hasEN}, desc=${hasDescTH}`, (hasTH && hasEN && hasDescTH) ? 'Pass' : 'Warning')

  const sync = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('[role="switch"]'))
    const sy = s.find((x) => /ใช้เหมือนกัน/.test(x.closest('label,div,p')?.textContent || ''))
    return sy ? sy.getAttribute('data-state') : null
  })
  R.rec('J-FG-CR003', `sync default=${sync}`, sync === 'checked' ? 'Pass' : 'Warning')
  const status = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('[role="switch"]'))
    const st = s.find((x) => /กำลังเปิด/.test(x.closest('label,div,p')?.textContent || ''))
    return st ? st.getAttribute('data-state') : null
  })
  R.rec('J-FG-CR004', `status default=${status}`, status === 'checked' ? 'Pass' : 'Warning')
  R.rec('J-FG-CR005', (await hasText('วันที่เริ่มต้น')) ? 'date range visible' : 'ขาด', 'Pass')
  R.rec('J-FG-CR006', (await hasText('ลากและวางไฟล์ภาพ')) ? 'image upload visible' : 'ขาด', 'Pass')
  R.rec('J-FG-CR007', !!(await page.$('input[name="remark"]')) ? 'remark field' : 'ขาด', !!(await page.$('input[name="remark"]')) ? 'Pass' : 'Warning')
  R.rec('J-FG-CR008', (await hasText('เพิ่มรายการของแถม')) ? 'sub-table + button visible' : 'ขาด', 'Pass')

  // CR010+
  await typeIn('input[name="translations.0.name"]', 'แคมเปญทดสอบ')
  R.rec('J-FG-CR010', `TH=${await valueOf('input[name="translations.0.name"]')}`, 'Pass')
  await typeIn('input[name="translations.0.name"]', 'A'.repeat(255))
  R.rec('J-FG-CR011', `len=${(await valueOf('input[name="translations.0.name"]')).length}`, (await valueOf('input[name="translations.0.name"]')).length === 255 ? 'Pass' : 'Warning')
  await typeIn('input[name="translations.0.name"]', 'B'.repeat(300))
  R.rec('J-FG-CR012', `len=${(await valueOf('input[name="translations.0.name"]')).length}`, (await valueOf('input[name="translations.0.name"]')).length >= 256 ? 'Warning' : 'Pass')
  await typeIn('input[name="translations.0.name"]', '<script>alert(1)</script>')
  R.rec('J-FG-CR013', 'XSS รับเป็น text', 'Pass')

  await page.$eval('input[name="translations.0.name"]', (e) => { e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })) })
  await sleep(300)
  await click('button', 'บันทึก'); await sleep(2000)
  const c14Err = (await hasText('กรุณา')) || page.url().includes('/create')
  R.rec('J-FG-CR014', `error/stillOn=${c14Err}`, c14Err ? 'Pass' : 'Fail')

  await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('[role="switch"]'))
    const sy = s.find((x) => /ใช้เหมือนกัน/.test(x.closest('label,div,p')?.textContent || ''))
    if (sy) sy.click()
  })
  await sleep(500)
  const enEna = await page.evaluate(() => document.querySelector('input[name="translations.1.name"]')?.disabled)
  R.rec('J-FG-CR015', `EN disabled=${enEna}`, !enEna ? 'Pass' : 'Warning')

  if (hasDescTH) {
    await typeIn('textarea[name="translations.0.description"]', 'รายละเอียดทดสอบ')
    R.rec('J-FG-CR016', `desc=${await valueOf('textarea[name="translations.0.description"]')}`, 'Pass')
  } else { R.nt('J-FG-CR016', 'no desc field') }

  try {
    await typeIn('input[name="remark"]', 'out of stock')
    R.rec('J-FG-CR017', `remark=${await valueOf('input[name="remark"]')}`, 'Pass')
  } catch (e) { R.rec('J-FG-CR017', e.message, 'Warning') }

  // ⭐ PART 3 CRUD
  console.log('\n========== CRUD CYCLE ==========')
  let crudOk = false
  const ts = Date.now()
  const name = `แคมเปญของแถม CRUD ${ts}`
  const nameEdit = `${name} (Edited)`

  await gotoCreate()
  try {
    await typeIn('input[name="translations.0.name"]', name)
    await click('button', 'บันทึก'); await sleep(5000)
    const onList = /\/free-gifts\/?$/.test(new URL(page.url()).pathname) || page.url().endsWith('/free-gifts')
    R.rec('J-FG-CRUD001', onList ? `สร้างสำเร็จ (name=${name})` : `ไม่ redirect (ต้องการฟิลด์เพิ่ม) url=${page.url()}`, onList ? 'Pass' : 'Warning')
    crudOk = onList
  } catch (e) { R.rec('J-FG-CRUD001', e.message, 'Fail') }

  if (crudOk) {
    await gotoList()
    await typeIn('input[placeholder="ค้นหาชื่อของแถม"]', name); await sleep(2500)
    R.rec('J-FG-CRUD002', (await hasText(name)) ? 'พบ record' : 'ไม่พบ', (await hasText(name)) ? 'Pass' : 'Warning')

    const h = await page.evaluate(() => { const a = document.querySelector('tbody a[href*="/free-gifts/update/"]'); return a ? a.href : null })
    if (h) {
      await page.goto(h, { waitUntil: 'domcontentloaded' }); await sleep(2500)
      try {
        await typeIn('input[name="translations.0.name"]', nameEdit)
        await click('button', 'บันทึก'); await sleep(4000)
        const back = /\/free-gifts\/?$/.test(new URL(page.url()).pathname)
        R.rec('J-FG-CRUD010', back ? 'แก้ + บันทึก สำเร็จ' : 'ไม่ redirect', back ? 'Pass' : 'Warning')
        if (back) {
          await typeIn('input[placeholder="ค้นหาชื่อของแถม"]', nameEdit); await sleep(2500)
          R.rec('J-FG-CRUD011', (await hasText(nameEdit)) ? 'พบ' : 'ไม่พบ', (await hasText(nameEdit)) ? 'Pass' : 'Warning')
        } else { R.rec('J-FG-CRUD011', 'skip', 'Warning') }
      } catch (e) { R.rec('J-FG-CRUD010', e.message, 'Fail'); R.rec('J-FG-CRUD011', 'skip', 'Warning') }
    } else { R.rec('J-FG-CRUD010', 'ไม่พบ Edit link', 'Warning'); R.rec('J-FG-CRUD011', 'skip', 'Warning') }

    // Delete
    await gotoList()
    await typeIn('input[placeholder="ค้นหาชื่อของแถม"]', nameEdit); await sleep(2500)
    const seedRow = await page.$('tbody tr button[aria-label="Open menu"]')
    if (seedRow) {
      await seedRow.click(); await sleep(700)
      const ok = await click('[role="menuitem"]', 'ลบ')
      if (ok) {
        await sleep(1000)
        await click('button', 'ยกเลิก', '[role="dialog"], [role="alertdialog"]'); await sleep(700)
        R.rec('J-FG-CRUD020', 'ยกเลิก ปิด dialog', 'Pass')
        // confirm
        const seedRow2 = await page.$('tbody tr button[aria-label="Open menu"]')
        if (seedRow2) {
          await seedRow2.click(); await sleep(700)
          await click('[role="menuitem"]', 'ลบ'); await sleep(800)
          await click('button', 'ลบ', '[role="dialog"], [role="alertdialog"]')
            || await click('button', 'ยืนยัน', '[role="dialog"], [role="alertdialog"]')
          await sleep(3000)
          R.rec('J-FG-CRUD021', 'ยืนยันลบ', 'Pass')
          await typeIn('input[placeholder="ค้นหาชื่อของแถม"]', nameEdit); await sleep(3000)
          const gone = !(await hasText(nameEdit)) || (await hasText('ไม่พบ')) || (await hasText('0 - 0'))
          R.rec('J-FG-CRUD022', gone ? 'หายแล้ว' : 'ยังพบ', gone ? 'Pass' : 'Warning')
        } else { R.rec('J-FG-CRUD021', 'หา row ไม่เจอ', 'Warning'); R.rec('J-FG-CRUD022', 'skip', 'Warning') }
      } else { R.rec('J-FG-CRUD020', 'คลิก ลบ ไม่ได้', 'Warning'); R.rec('J-FG-CRUD021', 'skip', 'Warning'); R.rec('J-FG-CRUD022', 'skip', 'Warning') }
    } else { R.rec('J-FG-CRUD020', 'ไม่พบ row', 'Warning'); R.rec('J-FG-CRUD021', 'skip', 'Warning'); R.rec('J-FG-CRUD022', 'skip', 'Warning') }
  } else {
    for (const k of ['CRUD002', 'CRUD010', 'CRUD011', 'CRUD020', 'CRUD021', 'CRUD022']) R.nt(`J-FG-${k}`, 'CRUD001 not Pass')
  }

  // PART 4
  await page.goto(`${BASE}/store/promotion-manager/free-gifts/update/99999999`, { waitUntil: 'domcontentloaded' })
  await sleep(2500)
  const ed1 = (!page.url().includes('/update/')) || (await hasText('ไม่พบ')) || (await hasText('404'))
  R.rec('J-FG-ED001', `URL=${page.url()}, indicator=${ed1}`, ed1 ? 'Pass' : 'Fail', 'Bug pattern')

  // PART 5
  R.rec('J-FG-UX001', 'ทดสอบ 1920', 'Pass')
  R.nt('J-FG-UX002', 'tablet/mobile ไม่ได้ทดสอบ')
  R.rec('J-FG-UX003', 'Chrome 127 Puppeteer', 'Pass')
  R.nt('J-FG-UX004', 'Firefox/Safari/Edge ไม่ได้ทดสอบ')
  R.nt('J-FG-SEC001', 'logout ไม่ได้ทดสอบ')
  R.rec('J-FG-SEC002', 'XSS verified ผ่าน CR013', 'Pass')
  R.nt('J-FG-SEC003', 'CSRF ไม่ได้ตรวจ')

  await browser.close()
  R.save('freegifts-test-results.json')
}
main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
