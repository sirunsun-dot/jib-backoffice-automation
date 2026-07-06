/**
 * E2E สร้างสินค้าจนจบ (Puppeteer) — ใช้ flow ตาม BA + UI searchable-select ปัจจุบัน
 * รัน: node scripts/run-products-e2e-create.js [--no-delete]
 */
const fs = require('fs')
const path = require('path')
const { launchAndLogin, sleep } = require('./_helpers')
const { createProductE2E } = require('./lib/product-create-flow')

const CREATE_URL = 'https://devstorex.jibc.codelabdev.co/store/product-manager/products/create'
const LIST_URL = 'https://devstorex.jibc.codelabdev.co/store/product-manager/products'
const keep = process.argv.includes('--no-delete')

async function main() {
  const { browser, page } = await launchAndLogin()
  await page.goto(CREATE_URL, { waitUntil: 'networkidle2', timeout: 90000 })
  await sleep(4000)

  const result = await createProductE2E(page)
  console.log('\n✅ Create result:', JSON.stringify(result, null, 2))

  if (result.ok) {
    await page.goto(LIST_URL, { waitUntil: 'domcontentloaded' })
    await sleep(2500)
    const inp = await page.$('input[placeholder="ค้นหา"]')
    if (inp) {
      await inp.click({ clickCount: 3 })
      await inp.type(result.sku, { delay: 15 })
      await sleep(2500)
    }
    const found = await page.evaluate((s) => document.body.innerText.includes(s), result.sku)
    console.log(found ? `✅ พบใน list: ${result.sku}` : `⚠️ ไม่พบใน list: ${result.sku}`)

    if (!keep && found) {
      const menu = await page.$('tbody tr button[aria-label="Open menu"]')
      if (menu) {
        await menu.click()
        await sleep(800)
        await page.evaluate(() => {
          const item = Array.from(document.querySelectorAll('[role="menuitem"]')).find((e) => e.textContent.includes('ลบ'))
          item?.click()
        })
        await sleep(1000)
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('[role="dialog"] button, [role="alertdialog"] button'))
            .find((b) => ['ลบ', 'ยืนยัน'].includes(b.textContent.trim()))
          btn?.click()
        })
        await sleep(3000)
        console.log('🗑️ ลบ test product แล้ว (ใช้ --no-delete เพื่อเก็บไว้)')
      }
    }
  }

  const resPath = path.join(__dirname, 'products-test-results.json')
  let data = {}
  try { data = JSON.parse(fs.readFileSync(resPath, 'utf8')) } catch {}
  data['J-PROD-CRUD001'] = {
    actual: result.ok ? `สร้างสำเร็จ E2E (sku=${result.sku})` : `fail url=${result.url}`,
    result: result.ok ? 'Pass' : 'Fail',
  }
  fs.writeFileSync(resPath, JSON.stringify(data, null, 2))

  await browser.close()
  process.exit(result.ok ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
