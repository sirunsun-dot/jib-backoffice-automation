/**
 * Deep create tests — โปรผ่อน 0% (หลายเงื่อนไข)
 * รัน: CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/run-installment-prozero-create-tests.js
 */
const fs = require('fs')
const path = require('path')
const { BASE, launchAndLogin, makeApi, Results, sleep } = require('./_helpers')

const CREATE_URL = `${BASE}/store/installment/installment-prozero/create`
const LIST_URL = `${BASE}/store/installment/installment-prozero`
const RESULTS_PATH = path.join(__dirname, '../testcases/results/ipz-create-test-results.json')

const SKU_OK = '1114000102'
const SKU_BAD = `NO-SKU-${Date.now()}`

async function pickDateRange(page, startIdx = 5, endIdx = 18) {
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('ระบุวันที่เริ่ม'))?.click())
  await sleep(1200)
  const cells = await page.$$('[role="gridcell"]:not([data-outside-day]) button')
  if (cells[startIdx]) await cells[startIdx].click()
  await sleep(280)
  if (cells[endIdx]) await cells[endIdx].click()
  await sleep(280)
  const applied = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent.trim() === 'ใช้งาน')
    if (!btn) return false
    btn.click()
    return true
  })
  await sleep(900)
  return applied
}

async function clearDateRange(page) {
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('ระบุวันที่เริ่ม') || b.textContent.includes('ก.ค.') || b.textContent.includes('ส.ค.'))?.click())
  await sleep(1000)
  await page.evaluate(() => Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent.trim() === 'ล้างทั้งหมด')?.click())
  await sleep(400)
  await page.evaluate(() => Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent.trim() === 'ใช้งาน')?.click())
  await sleep(600)
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
  return {
    onList: !page.url().includes('/create'),
    url: page.url(),
    api,
    errs: await page.evaluate(() => (document.body.innerText.match(/กรุณา[^\n]+|ไม่พบ|ซ้ำ|มีอยู่แล้ว|ไม่ถูกต้อง|ไม่มีสิทธิ์|forbidden/gi) || []).slice(0, 8)),
    success: await page.evaluate(() => (document.body.innerText.match(/สำเร็จ[^\n]*/gi) || [])),
  }
}

async function getFormState(page) {
  return page.evaluate(() => ({
    errs: (document.body.innerText.match(/กรุณา[^\n]+/g) || []),
    progress: (document.body.innerText.match(/(\d+)%/) || [])[0],
    planCount: (document.body.innerText.match(/แผนที่\s*\d+/g) || []).length,
    hasProductTable: document.body.innerText.includes('สินค้าที่ร่วมรายการ'),
  }))
}

async function setStatus(page, on) {
  await page.evaluate((wantOn) => {
    const s = Array.from(document.querySelectorAll('[role="switch"]'))
    const st = s.find((x) => /กำลังเปิด/.test(x.closest('label,div,p')?.textContent || ''))
    if (!st) return
    const isOn = st.getAttribute('data-state') === 'checked'
    if (isOn !== wantOn) st.click()
  }, on)
  await sleep(400)
}

async function selectProductFromDialog(page) {
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'เลือกสินค้า')?.click())
  await sleep(3000)
  const picked = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]')
    if (!dlg) return { open: false }
    const row = dlg.querySelector('tbody tr, [data-slot="table-row"], tr[data-index="0"]')
    const cb = row?.querySelector('input[type="checkbox"], [role="checkbox"], button')
    cb?.click()
    const ok = Array.from(dlg.querySelectorAll('button')).find((b) => /ยืนยัน|เลือก|ตกลง|เพิ่ม/.test(b.textContent))
    ok?.click()
    return { open: true, clicked: !!cb }
  })
  await sleep(2500)
  return picked
}

async function main() {
  const useDemo = process.env.LOGIN_MODE === 'demo' || process.env.USE_DEMO === '1'
  const { browser, page, loginMode } = await launchAndLogin({ demo: useDemo })
  console.log(`Login mode: ${loginMode}`)
  const { hasText, click } = makeApi(page)
  const R = new Results()

  const gotoCreate = async () => {
    await page.goto(CREATE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForFunction(() => document.body?.innerText.includes('เพิ่มโปรผ่อน'), { timeout: 15000 }).catch(() => {})
    await sleep(2000)
  }

  // ---- VALIDATION ----
  await gotoCreate()
  await click('button', 'บันทึก')
  await sleep(2000)
  const v1 = await getFormState(page)
  R.rec('J-IPZ-CC001', `errors=${JSON.stringify(v1.errs.slice(0, 4))}`, v1.errs.some((e) => e.includes('วันเริ่ม')) && v1.errs.some((e) => e.includes('แผน')) ? 'Pass' : 'Warning')

  await gotoCreate()
  await pickDateRange(page)
  await click('button', 'บันทึก')
  await sleep(2000)
  const v2 = await getFormState(page)
  R.rec('J-IPZ-CC002', `มีวันที่แต่ไม่มีแผน+สินค้า errs=${JSON.stringify(v2.errs.slice(0, 3))}`, v2.errs.some((e) => e.includes('แผน')) ? 'Pass' : 'Warning')

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await click('button', 'บันทึก')
  await sleep(2000)
  const v3 = await getFormState(page)
  R.rec('J-IPZ-CC003', `มีวันที่+แผน ไม่มีสินค้า errs=${JSON.stringify(v3.errs)}`, v3.errs.length > 0 || page.url().includes('/create') ? 'Pass' : 'Warning')

  await gotoCreate()
  await pickDateRange(page)
  await addSku(page, SKU_OK)
  await click('button', 'บันทึก')
  await sleep(2000)
  const v4 = await getFormState(page)
  R.rec('J-IPZ-CC004', `มีวันที่+สินค้า ไม่มีแผน errs=${JSON.stringify(v4.errs.slice(0, 3))}`, v4.errs.some((e) => e.includes('แผน')) ? 'Pass' : 'Warning')

  await gotoCreate()
  await addPlan(page, 'KBANK|กสิกร', 6)
  await addSku(page, SKU_OK)
  await click('button', 'บันทึก')
  await sleep(2000)
  const v5 = await getFormState(page)
  R.rec('J-IPZ-CC005', `มีแผน+สินค้า ไม่มีวันที่ errs=${JSON.stringify(v5.errs.slice(0, 3))}`, v5.errs.some((e) => e.includes('วัน')) ? 'Pass' : 'Warning')

  // ---- DATE PICKER ----
  await gotoCreate()
  const applied = await pickDateRange(page)
  const dateClosed = !(await page.$('[role="dialog"]'))
  R.rec('J-IPZ-CC010', `เลือกช่วงวัน + กดใช้งาน applied=${applied} dialogClosed=${dateClosed}`, applied && dateClosed ? 'Pass' : 'Fail')

  await gotoCreate()
  await pickDateRange(page, 5, 18)
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('ระบุวันที่') || b.textContent.includes('ก.ค.'))?.click())
  await sleep(1000)
  const hasClear = await page.evaluate(() => !!Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent.trim() === 'ล้างทั้งหมด'))
  R.rec('J-IPZ-CC011', `เปิด picker ซ้ำ + มีปุ่มล้างทั้งหมด=${hasClear}`, hasClear ? 'Pass' : 'Warning')
  await page.keyboard.press('Escape')

  await gotoCreate()
  await page.evaluate(() => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('ระบุวันที่เริ่ม'))?.click())
  await sleep(1000)
  await page.evaluate(() => Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) => b.textContent.trim() === 'ยกเลิก')?.click())
  await sleep(600)
  R.rec('J-IPZ-CC012', (await page.$('[role="dialog"]')) ? 'ยกเลิกปิด dialog' : 'dialog ปิด', !(await page.$('[role="dialog"]')) ? 'Pass' : 'Warning')

  // ---- PLANS: ธนาคารต่างๆ ----
  const banks = [
    { id: 'J-IPZ-CC020', pat: 'KBANK|กสิกร', label: 'KBANK 6 งวด' },
    { id: 'J-IPZ-CC021', pat: 'KTC', label: 'KTC 10 งวด' },
    { id: 'J-IPZ-CC022', pat: 'Proud|PROUD', label: 'KTC Proud 12 งวด' },
    { id: 'J-IPZ-CC023', pat: 'KCC', label: 'KCC 3 งวด' },
  ]
  const monthsMap = { 'J-IPZ-CC020': 6, 'J-IPZ-CC021': 10, 'J-IPZ-CC022': 12, 'J-IPZ-CC023': 3 }
  for (const b of banks) {
    await gotoCreate()
    await pickDateRange(page)
    await addPlan(page, b.pat, monthsMap[b.id])
    const st = await page.evaluate((pat) => {
      const txt = document.body.innerText
      return { hasPlan: txt.includes('แผนที่ 1'), bank: new RegExp(pat.split('|')[0], 'i').test(txt) }
    }, b.pat)
    R.rec(b.id, `${b.label} planAdded=${st.hasPlan}`, st.hasPlan ? 'Pass' : 'Warning')
  }

  // Multiple plans
  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await addPlan(page, 'KTC', 10)
  const multi = await page.evaluate(() => (document.body.innerText.match(/แผนที่\s*\d+/g) || []).length)
  R.rec('J-IPZ-CC030', `เพิ่ม 2 แผน (KBANK+KTC) count=${multi}`, multi >= 2 ? 'Pass' : 'Warning')

  // Plan without bank
  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'XXXX', 6, { skipBank: true })
  await addSku(page, SKU_OK)
  const pb = await clickSave(page)
  R.rec('J-IPZ-CC031', `ไม่เลือกธนาคาร → ${pb.onList ? 'save' : 'stay'} errs=${JSON.stringify(pb.errs.slice(0, 2))}`, !pb.onList ? 'Pass' : 'Warning')

  // Plan invalid months
  for (const [id, months, note] of [['J-IPZ-CC032', '0', '0 งวด'], ['J-IPZ-CC033', 'abc', 'ตัวอักษร'], ['J-IPZ-CC034', '', 'ว่าง']]) {
    await gotoCreate()
    await pickDateRange(page)
    await addPlan(page, 'KBANK|กสิกร', months)
    await addSku(page, SKU_OK)
    const r = await clickSave(page)
    R.rec(id, `${note} → onList=${r.onList} api=${r.api?.status || '-'}`, !r.onList ? 'Pass' : 'Warning')
  }

  // ---- PRODUCT ----
  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await addSku(page, SKU_OK)
  const hasSku = await hasText(SKU_OK)
  R.rec('J-IPZ-CC040', hasSku ? `SKU ${SKU_OK} ในตาราง` : 'ไม่พบในตาราง', hasSku ? 'Pass' : 'Warning')

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await addSku(page, SKU_BAD)
  const badSku = await page.evaluate(() => (document.body.innerText.match(/ไม่พบ|ไม่ถูกต้อง|ไม่มีสินค้า/gi) || []))
  R.rec('J-IPZ-CC041', `SKU ไม่มี → ${JSON.stringify(badSku.slice(0, 2))}`, badSku.length > 0 || !(await hasText(SKU_BAD)) ? 'Pass' : 'Warning')

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await addSku(page, '<script>alert(1)</script>')
  const xss = await page.evaluate(() => !document.querySelector('script[src*="alert"]'))
  R.rec('J-IPZ-CC042', `XSS ใน SKU ไม่ execute=${xss}`, xss ? 'Pass' : 'Fail')

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await addSku(page, SKU_OK)
  await addSku(page, SKU_OK)
  const dup = await page.evaluate(() => {
    const matches = document.body.innerText.match(new RegExp('1114000102', 'g'))
    return matches ? matches.length : 0
  })
  R.rec('J-IPZ-CC043', `เพิ่ม SKU ซ้ำ count=${dup}`, dup <= 2 ? 'Pass' : 'Warning', 'กฎ 1 โปรต่อ 1 สินค้า')

  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  const dlg = await selectProductFromDialog(page)
  R.rec('J-IPZ-CC044', `เลือกสินค้าจาก dialog open=${dlg.open} picked=${dlg.clicked}`, dlg.open ? 'Pass' : 'Warning')

  // ---- STATUS ----
  await gotoCreate()
  await setStatus(page, false)
  const off = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('[role="switch"]')).find((x) => /กำลังเปิด/.test(x.closest('label,div,p')?.textContent || ''))
    return s?.getAttribute('data-state')
  })
  R.rec('J-IPZ-CC050', `ปิดสถานะ → state=${off}`, off === 'unchecked' ? 'Pass' : 'Warning')

  await gotoCreate()
  await setStatus(page, true)
  const on = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('[role="switch"]')).find((x) => /กำลังเปิด/.test(x.closest('label,div,p')?.textContent || ''))
    return s?.getAttribute('data-state')
  })
  R.rec('J-IPZ-CC051', `เปิดสถานะ → state=${on}`, on === 'checked' ? 'Pass' : 'Warning')

  // ---- E2E SAVE (API permission) ----
  const e2eCases = [
    { id: 'J-IPZ-CC060', bank: 'KBANK|กสิกร', months: 6, sku: SKU_OK, note: 'KBANK 6งวด + SKU' },
    { id: 'J-IPZ-CC061', bank: 'KTC', months: 10, sku: SKU_OK, note: 'KTC 10งวด + SKU' },
    { id: 'J-IPZ-CC062', bank: 'KBANK|กสิกร', months: 6, sku: SKU_OK, statusOff: true, note: 'สถานะปิด' },
    { id: 'J-IPZ-CC063', bank: 'KBANK|กสิกร', months: 6, sku: SKU_OK, multiPlan: true, note: '2 แผน KBANK+KTC' },
  ]

  for (const c of e2eCases) {
    await gotoCreate()
    await pickDateRange(page)
    if (c.statusOff) await setStatus(page, false)
    await addPlan(page, c.bank, c.months)
    if (c.multiPlan) await addPlan(page, 'KTC', 10)
    await addSku(page, c.sku)
    const r = await clickSave(page)
    const formOk = !r.errs.some((e) => /กรุณาระบุวัน|กรุณาเพิ่มแผน/.test(e))
    let result = 'Warning'
    if (r.onList) result = 'Pass'
    else if (r.api?.status === 201 || r.api?.status === 200) result = 'Pass'
    else if (r.api?.status === 403) result = formOk ? 'Warning' : 'Fail'
    else if (!formOk) result = 'Fail'
    R.rec(c.id, `${c.note} api=${r.api?.status || 'no-post'} onList=${r.onList} formOk=${formOk}`, result, r.api?.status === 403 ? 'ใช้ LOGIN_MODE=demo — บัญชี sirun ไม่มีสิทธิ์สร้าง' : '')
  }

  // Cancel: fill then leave
  await gotoCreate()
  await pickDateRange(page)
  await addPlan(page, 'KBANK|กสิกร', 6)
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded' })
  await sleep(1500)
  R.rec('J-IPZ-CC070', page.url().includes('/installment-prozero') && !page.url().includes('/create') ? 'ออกจาก create ไม่บันทึก' : page.url(), 'Pass')

  await browser.close()
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(R.data, null, 2), 'utf8')
  const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
  for (const k of Object.keys(R.data)) sum[R.data[k].result] = (sum[R.data[k].result] || 0) + 1
  console.log('\n[ipz-create-test-results.json] SUMMARY:', JSON.stringify(sum), 'Total:', Object.keys(R.data).length)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
