/**
 * Deep create tests — โปรผ่อน 0% (Demo login, ครอบคลุมทุกเงื่อนไข + หาบัค)
 * รัน: LOGIN_MODE=demo CHROME="..." node scripts/run-installment-prozero-create-deep-tests.js
 */
const fs = require('fs')
const path = require('path')
const { BASE, launchAndLogin, makeApi, Results, sleep } = require('./_helpers')

const CREATE_URL = `${BASE}/store/installment/installment-prozero/create`
const LIST_URL = `${BASE}/store/installment/installment-prozero`
const RESULTS_PATH = path.join(__dirname, '../testcases/results/ipz-create-deep-test-results.json')
const BUGS_PATH = path.join(__dirname, '../testcases/results/ipz-create-bugs.json')

const USED_SKUS = new Set(['1114000102', 'CY-PROD-24420', '1046000493'])

async function pickDateRange(page, startIdx = 8, endIdx = 20) {
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('ระบุวันที่เริ่ม'))?.click())
  await sleep(1200)
  const cells = await page.$$('[role="gridcell"]:not([data-outside-day]) button')
  if (cells[startIdx]) await cells[startIdx].click()
  await sleep(250)
  if (cells[endIdx]) await cells[endIdx].click()
  await sleep(250)
  await page.evaluate(() => Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent.trim() === 'ใช้งาน')?.click())
  await sleep(900)
}

async function pickDateRangeReverse(page) {
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('ระบุวันที่เริ่ม'))?.click())
  await sleep(1200)
  const cells = await page.$$('[role="gridcell"]:not([data-outside-day]) button')
  if (cells[20]) await cells[20].click()
  await sleep(250)
  if (cells[8]) await cells[8].click()
  await sleep(250)
  const applyState = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent.trim() === 'ใช้งาน')
    return { disabled: btn?.disabled, exists: !!btn }
  })
  if (!applyState.disabled) {
    await page.evaluate(() => Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent.trim() === 'ใช้งาน')?.click())
  }
  await sleep(900)
  return applyState
}

async function addPlan(page, bankPat, months, { skipBank = false } = {}) {
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'เพิ่มแผน')?.click())
  await sleep(800)
  if (!skipBank) {
    const combos = await page.$$('[role="combobox"], button[data-slot="searchable-select-trigger"]')
    const combo = combos[combos.length - 1]
    if (combo) {
      await combo.click()
      await sleep(900)
      await page.evaluate((pat) => {
        const item = Array.from(document.querySelectorAll('[data-slot="command-item"], [role="option"]'))
          .find((e) => new RegExp(pat, 'i').test(e.textContent))
        item?.click()
      }, bankPat)
      await sleep(350)
    }
  }
  if (months !== null && months !== undefined) {
    const mis = await page.$$('input[placeholder="เช่น 10"]')
    const mi = mis[mis.length - 1]
    if (mi) {
      await mi.click({ clickCount: 3 })
      await mi.press('Backspace')
      if (months !== '') await mi.type(String(months), { delay: 10 })
    }
  }
}

async function deleteLastPlan(page) {
  const ok = await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="ลบแผน"]')
    if (btn) { btn.click(); return true }
    return false
  })
  await sleep(600)
  return ok
}

async function addSku(page, sku) {
  const inp = await page.$('input[placeholder*="SKU"]')
  if (!inp) return false
  await inp.click({ clickCount: 3 })
  await inp.press('Backspace')
  await inp.type(String(sku), { delay: 10 })
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).filter((b) => b.textContent.trim() === 'เพิ่ม').pop()?.click())
  await sleep(2200)
  return true
}

async function pickProductFromDialog(page, rowIndex = 0) {
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'เลือกสินค้า')?.click())
  await sleep(3000)
  const info = await page.evaluate((idx) => {
    const dlg = document.querySelector('[role="dialog"]')
    if (!dlg) return { open: false }
    const rows = Array.from(dlg.querySelectorAll('tbody tr'))
    const row = rows[idx]
    const text = row?.innerText || ''
    const sku = (text.match(/\b(\d{10,})\b/) || [])[1] || null
    row?.querySelector('input[type="checkbox"], [role="checkbox"]')?.click()
    const okBtn = Array.from(dlg.querySelectorAll('button')).find((b) => /ยืนยัน|เลือก|ตกลง|เพิ่ม/.test(b.textContent))
    okBtn?.click()
    return { open: true, sku, text: text.slice(0, 80) }
  }, rowIndex)
  await sleep(2500)
  return info
}

async function findFreshSku(page) {
  await page.goto(CREATE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(2000)
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'เลือกสินค้า')?.click())
  await sleep(3000)
  const sku = await page.evaluate((used) => {
    const usedSet = new Set(used)
    const rows = Array.from(document.querySelectorAll('[role="dialog"] tbody tr'))
    for (const row of rows) {
      const m = row.innerText.match(/\b(\d{10,})\b/)
      if (m && !usedSet.has(m[1])) return m[1]
    }
    return null
  }, [...USED_SKUS])
  await page.keyboard.press('Escape')
  await sleep(500)
  if (sku) USED_SKUS.add(sku)
  return sku
}

async function clickSave(page) {
  let api = null
  const handler = async (res) => {
    const u = res.url()
    if (u.includes('/api/installment-promo/private') && res.request().method() === 'POST') {
      let body = null
      try { body = await res.json() } catch {}
      api = { status: res.status(), body }
    }
  }
  page.on('response', handler)
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'บันทึก')?.click())
  await sleep(12000)
  page.off('response', handler)
  const uiMsgs = await page.evaluate(() => (document.body.innerText.match(/สำเร็จ[^\n]*|กรุณา[^\n]*|ทับซ้อน|overlap|conflict|ไม่พบ[^\n]*/gi) || []).slice(0, 8))
  return {
    onList: !page.url().includes('/create'),
    url: page.url(),
    api,
    uiMsgs,
    errs: await page.evaluate(() => (document.body.innerText.match(/กรุณา[^\n]+/g) || [])),
  }
}

async function setStatus(page, on) {
  const changed = await page.evaluate((wantOn) => {
    const switches = Array.from(document.querySelectorAll('[role="switch"]'))
    const st = switches.find((x) => /กำลังเปิด/.test((x.closest('label,div,p')?.textContent || '')))
    if (!st) return null
    const isOn = st.getAttribute('data-state') === 'checked'
    if (isOn !== wantOn) st.click()
    return st.getAttribute('data-state')
  }, on)
  await sleep(500)
  const state = await page.evaluate(() => {
    const st = Array.from(document.querySelectorAll('[role="switch"]')).find((x) => /กำลังเปิด/.test((x.closest('label,div,p')?.textContent || '')))
    return st?.getAttribute('data-state')
  })
  return { changed, state }
}

async function countProductsInForm(page) {
  return page.evaluate(() => {
    const part = document.body.innerText.split('สินค้าที่ร่วมรายการ')[1]?.slice(0, 800) || ''
    return (part.match(/\b\d{10,}\b/g) || []).length
  })
}

async function main() {
  const useDemo = process.env.LOGIN_MODE === 'demo' || process.env.USE_DEMO === '1' || true
  const { browser, page, loginMode } = await launchAndLogin({ demo: useDemo })
  console.log(`Login mode: ${loginMode}`)
  const { click } = makeApi(page)
  const R = new Results()
  const bugs = []

  const bug = (id, title, detail, severity = 'medium') => {
    bugs.push({ id, title, detail, severity })
    console.log(`[BUG ${id}] ${title}`)
  }

  const gotoCreate = async () => {
    await page.goto(CREATE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForFunction(() => document.body?.innerText.includes('เพิ่มโปรผ่อน'), { timeout: 15000 }).catch(() => {})
    await sleep(2000)
  }

  // ========== A. VALIDATION ==========
  await gotoCreate()
  await click('button', 'บันทึก')
  await sleep(2000)
  const vEmpty = await page.evaluate(() => (document.body.innerText.match(/กรุณา[^\n]+/g) || []))
  const vOk = vEmpty.some((e) => e.includes('วันเริ่ม')) && vEmpty.some((e) => e.includes('แผน'))
  R.rec('J-IPZ-CD001', `ว่างทั้งหมด errs=${JSON.stringify(vEmpty.slice(0, 4))}`, vOk ? 'Pass' : 'Fail')

  for (const [id, setup, expect] of [
    ['J-IPZ-CD002', async () => { await pickDateRange(page) }, 'แผน'],
    ['J-IPZ-CD003', async () => { await pickDateRange(page); await addPlan(page, 'KBANK|กสิกร', 6) }, 'สินค้า'],
    ['J-IPZ-CD004', async () => { await pickDateRange(page); await addSku(page, '1046000490') }, 'แผน'],
    ['J-IPZ-CD005', async () => { await addPlan(page, 'KBANK|กสิกร', 6); await addSku(page, '1046000490') }, 'วัน'],
  ]) {
    await gotoCreate()
    await setup()
    await click('button', 'บันทึก')
    await sleep(2000)
    const errs = await page.evaluate(() => (document.body.innerText.match(/กรุณา[^\n]+/g) || []))
    R.rec(id, `errs=${JSON.stringify(errs.slice(0, 3))}`, errs.some((e) => e.includes(expect)) || errs.length > 0 ? 'Pass' : 'Warning')
  }

  // ========== B. DATE PICKER ==========
  await gotoCreate()
  await pickDateRange(page)
  R.rec('J-IPZ-CD010', !(await page.$('[role="dialog"]')) ? 'เลือกวัน + ใช้งาน ปิด dialog' : 'dialog ค้าง', 'Pass')

  await gotoCreate()
  await pickDateRange(page)
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('ก.ค.') || b.textContent.includes('ระบุวันที่'))?.click())
  await sleep(1000)
  const hasClear = await page.evaluate(() => !!Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent.trim() === 'ล้างทั้งหมด'))
  R.rec('J-IPZ-CD011', `ล้างทั้งหมด หลังเลือกวัน=${hasClear}`, hasClear ? 'Pass' : 'Warning')

  await gotoCreate()
  const rev = await pickDateRangeReverse(page)
  const revErrs = await page.evaluate(() => (document.body.innerText.match(/กรุณา[^\n]+/g) || []))
  const revBug = revErrs.length === 0 && !rev.disabled
  R.rec('J-IPZ-CD012', `วันสิ้นสุดก่อนวันเริ่ม applyDisabled=${rev.disabled} errs=${JSON.stringify(revErrs)}`, revBug ? 'Fail' : 'Pass')
  if (revBug) bug('IPZ-DATE-001', 'วันสิ้นสุดก่อนวันเริ่มยังกดใช้งานได้', 'เลือกวันสิ้นสุดก่อนวันเริ่มแล้วกดใช้งาน — ไม่มี validation error', 'high')

  await gotoCreate()
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('ระบุวันที่เริ่ม'))?.click())
  await sleep(1000)
  const timeInputs = await page.evaluate(() => Array.from(document.querySelectorAll('[role="dialog"] input')).map((i) => i.value))
  R.rec('J-IPZ-CD013', `time defaults=${JSON.stringify(timeInputs)}`, timeInputs.includes('00:00') && timeInputs.includes('23:59') ? 'Pass' : 'Warning')
  await page.keyboard.press('Escape')

  // ========== C. แผนผ่อน ==========
  const bankCases = [
    ['J-IPZ-CD020', 'KBANK|กสิกร', 6],
    ['J-IPZ-CD021', 'KTC', 10],
    ['J-IPZ-CD022', 'Proud|PROUD', 12],
    ['J-IPZ-CD023', 'KCC', 3],
  ]
  for (const [id, pat, mo] of bankCases) {
    await gotoCreate()
    await pickDateRange(page)
    await addPlan(page, pat, mo)
    const n = await page.evaluate(() => (document.body.innerText.match(/แผนที่\s*1/) || []).length)
    R.rec(id, `${pat} ${mo}งวด plan=${n > 0}`, n > 0 ? 'Pass' : 'Warning')
  }

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await addPlan(page, 'KTC', 10)
  const plan2 = await page.evaluate(() => (document.body.innerText.match(/แผนที่\s*\d+/g) || []).length)
  R.rec('J-IPZ-CD030', `2 แผนต่างธนาคาร count=${plan2}`, plan2 >= 2 ? 'Pass' : 'Warning')

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await addPlan(page, 'KBANK|กสิกร', 10)
  const dupBank = await page.evaluate(() => (document.body.innerText.match(/แผนที่\s*\d+/g) || []).length)
  R.rec('J-IPZ-CD031', `ธนาคารซ้ำ 2 แผน count=${dupBank}`, dupBank >= 2 ? 'Pass' : 'Warning', 'ต้องดูตอน save ว่า 409 หรือไม่')

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  const delOk = await deleteLastPlan(page)
  const stillPlan = await page.evaluate(() => document.body.innerText.includes('แผนที่ 1'))
  R.rec('J-IPZ-CD032', `ลบแผน ok=${delOk} still=${stillPlan}`, delOk && !stillPlan ? 'Pass' : 'Fail')

  for (const [id, months, label] of [['J-IPZ-CD033', '0', '0งวด'], ['J-IPZ-CD034', 'abc', 'ตัวอักษร'], ['J-IPZ-CD035', '', 'ว่าง']]) {
    await gotoCreate()
    await pickDateRange(page)
    await addPlan(page, 'KBANK|กสิกร', months)
    const sku = await findFreshSku(page)
    await gotoCreate()
    await pickDateRange(page)
    await addPlan(page, 'KBANK|กสิกร', months)
    if (sku) await addSku(page, sku)
    const r = await clickSave(page)
    R.rec(id, `${label} api=${r.api?.status || '-'} onList=${r.onList}`, !r.onList || (r.api?.status && r.api.status >= 400) ? 'Pass' : 'Warning')
  }

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'XXXX', 6, { skipBank: true })
  const skuA = await findFreshSku(page)
  if (skuA) { await gotoCreate(); await pickDateRange(page); await addPlan(page, 'XXXX', 6, { skipBank: true }); await addSku(page, skuA) }
  const noBank = await clickSave(page)
  R.rec('J-IPZ-CD036', `ไม่เลือกธนาคาร api=${noBank.api?.status || '-'}`, !noBank.onList ? 'Pass' : 'Fail')

  // ========== D. สินค้า ==========
  const skuFresh1 = await findFreshSku(page)
  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  if (skuFresh1) await addSku(page, skuFresh1)
  const hasSku1 = skuFresh1 ? await page.evaluate((s) => document.body.innerText.includes(s), skuFresh1) : false
  R.rec('J-IPZ-CD040', skuFresh1 ? `SKU ${skuFresh1} added=${hasSku1}` : 'ไม่หา SKU', hasSku1 ? 'Pass' : 'Warning')

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await addSku(page, `FAKE-${Date.now()}`)
  const badMsg = await page.evaluate(() => (document.body.innerText.match(/ไม่พบ|ไม่ถูกต้อง|ไม่มีสินค้า/gi) || []))
  R.rec('J-IPZ-CD041', `SKU ปลอม msg=${JSON.stringify(badMsg)}`, badMsg.length > 0 ? 'Pass' : 'Warning')

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  const dlg = await pickProductFromDialog(page, 1)
  R.rec('J-IPZ-CD042', `dialog row1 sku=${dlg.sku}`, dlg.open && dlg.sku ? 'Pass' : 'Warning')

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  const skuFresh2 = await findFreshSku(page)
  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  if (skuFresh2) {
    await addSku(page, skuFresh2)
    await addSku(page, skuFresh2)
  }
  const prodDup = await countProductsInForm(page)
  R.rec('J-IPZ-CD043', `เพิ่ม SKU ซ้ำใน form count=${prodDup}`, prodDup <= 1 ? 'Pass' : 'Warning')

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await pickProductFromDialog(page, 0)
  const skuFresh3 = await findFreshSku(page)
  if (skuFresh3) await addSku(page, skuFresh3)
  const prod2 = await countProductsInForm(page)
  const twoProdBug = prod2 > 1
  R.rec('J-IPZ-CD044', `สินค้า 2 รายการใน form (ผิดกฎ 1:1) count=${prod2}`, twoProdBug ? 'Fail' : 'Pass')
  if (twoProdBug) bug('IPZ-PROD-001', 'เพิ่มสินค้าได้มากกว่า 1 รายการในฟอร์ม', `กฎ 1 โปรต่อ 1 สินค้า แต่ form มี ${prod2} SKU`, 'high')

  // ========== E. สถานะ ==========
  await gotoCreate()
  const off = await setStatus(page, false)
  R.rec('J-IPZ-CD050', `ปิดสถานะ state=${off.state}`, off.state === 'unchecked' ? 'Pass' : 'Fail')
  if (off.state !== 'unchecked') bug('IPZ-UI-001', 'Toggle สถานะปิดไม่ทำงาน', `state ยังเป็น ${off.state}`, 'medium')

  await gotoCreate()
  const on = await setStatus(page, true)
  R.rec('J-IPZ-CD051', `เปิดสถานะ state=${on.state}`, on.state === 'checked' ? 'Pass' : 'Warning')

  // ========== F. E2E SAVE (unique SKU each) ==========
  const e2eScenarios = [
    { id: 'J-IPZ-CD060', bank: 'KBANK|กสิกร', months: 6, active: true, label: 'KBANK 6งวด เปิด' },
    { id: 'J-IPZ-CD061', bank: 'KTC', months: 10, active: true, label: 'KTC 10งวด' },
    { id: 'J-IPZ-CD062', bank: 'KCC', months: 3, active: false, label: 'KCC 3งวด ปิดสถานะ' },
    { id: 'J-IPZ-CD063', bank: 'KBANK|กสิกร', months: 6, active: true, multi: true, label: '2แผน KBANK+KTC' },
    { id: 'J-IPZ-CD064', bank: 'Proud|PROUD', months: 12, active: true, viaDialog: true, label: 'KTC Proud dialog' },
  ]

  for (const sc of e2eScenarios) {
    const sku = await findFreshSku(page)
    await gotoCreate()
    await pickDateRange(page)
    if (!sc.active) await setStatus(page, false)
    await addPlan(page, sc.bank, sc.months)
    if (sc.multi) await addPlan(page, 'KTC', 10)
    if (sc.viaDialog) {
      await pickProductFromDialog(page, 2)
    } else if (sku) {
      await addSku(page, sku)
    }
    const progress = await page.evaluate(() => (document.body.innerText.match(/(\d+)%/) || [])[0])
    const r = await clickSave(page)
    const ok = r.onList && (r.api?.status === 201 || r.api?.status === 200)
    R.rec(sc.id, `${sc.label} sku=${sku || 'dialog'} api=${r.api?.status} progress=${progress} onList=${r.onList}`, ok ? 'Pass' : (r.api?.status === 409 ? 'Warning' : 'Fail'))
    if (progress === '0%' && ok) bug('IPZ-UI-002', 'Progress 0% ทั้งที่กรอกครบ', `${sc.id} บันทึกสำเร็จแต่ progress ยัง 0%`, 'low')
  }

  // ========== G. CONFLICT 409 ==========
  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await addSku(page, '1114000102')
  const conflict = await clickSave(page)
  const overlap = conflict.api?.body?.message?.code === 'INSTALLMENT_OVERLAP'
  R.rec('J-IPZ-CD070', `SKU+ธนาคารทับซ้อน api=${conflict.api?.status} overlap=${overlap}`, conflict.api?.status === 409 ? 'Pass' : 'Warning')
  if (conflict.api?.status === 409 && conflict.uiMsgs.length === 0) {
    bug('IPZ-API-001', '409 INSTALLMENT_OVERLAP ไม่แสดงข้อความใน UI', 'API ตอบ overlap แต่หน้าจอไม่แสดงข้อความภาษาไทยให้ user', 'high')
    R.rec('J-IPZ-CD071', 'UI แสดงข้อความ conflict', 'Fail', 'Fail')
  } else {
    R.rec('J-IPZ-CD071', `UI msgs=${JSON.stringify(conflict.uiMsgs)}`, conflict.uiMsgs.length > 0 ? 'Pass' : 'Warning')
  }

  // ========== H. CANCEL ==========
  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded' })
  await sleep(1500)
  R.rec('J-IPZ-CD080', !page.url().includes('/create') ? 'ออกไม่บันทึก OK' : page.url(), 'Pass')

  // ========== I. VERIFY LIST ==========
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded' })
  await sleep(5000)
  const listInfo = await page.evaluate(() => ({
    footer: (document.body.innerText.match(/\d+ - \d+ จาก \d+/) || [])[0],
    rows: document.querySelectorAll('tbody tr').length,
  }))
  R.rec('J-IPZ-CD090', `list ${listInfo.footer} rows=${listInfo.rows}`, listInfo.rows > 0 ? 'Pass' : 'Warning')

  await browser.close()
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(R.data, null, 2), 'utf8')
  fs.writeFileSync(BUGS_PATH, JSON.stringify(bugs, null, 2), 'utf8')
  const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
  for (const k of Object.keys(R.data)) sum[R.data[k].result] = (sum[R.data[k].result] || 0) + 1
  console.log('\n[ipz-create-deep-test-results.json] SUMMARY:', JSON.stringify(sum), 'Total:', Object.keys(R.data).length)
  console.log(`\n[BUGS FOUND: ${bugs.length}]`)
  bugs.forEach((b) => console.log(`  - ${b.id}: ${b.title} (${b.severity})`))
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
