/**
 * E2E product create flow — Puppeteer helpers (searchable-select UI)
 */
const { sleep } = require('../_helpers')

const DEFAULTS = {
  brand: 'Acer',
  cat1: 'เซียมซี',
  cat2: 'เซียมซีย่อย1',
  stock: 10,
  lowStock: 2,
  price: 999,
}

const TRIGGER = {
  brand: 'แบรนด์',
  warranty: 'การรับประกัน',
  cat1: 'Category 1',
  cat2: 'Category 2',
  cat3: 'Category 3',
}

async function pickSearchable(page, triggerMatch, want) {
  await page.evaluate((m) => {
    const el = Array.from(document.querySelectorAll('button[data-slot="searchable-select-trigger"]'))
      .find((b) => (b.textContent || '').includes(m))
    if (!el) return
    el.scrollIntoView({ block: 'center' })
    el.click()
  }, triggerMatch)
  await sleep(want ? 1200 : 2000)

  if (want) {
    const inp = await page.$('[data-slot="popover-content"] input')
    if (inp) {
      await inp.click({ clickCount: 3 })
      await inp.press('Backspace')
      await inp.type(want, { delay: 25 })
      await sleep(1500)
    }
  }

  const picked = await page.evaluate((wantText) => {
    const pop = document.querySelector('[data-slot="popover-content"]')
    if (!pop) return null
    const spans = Array.from(pop.querySelectorAll('span.truncate, [data-slot="command-item"] span'))
    let target
    if (wantText) {
      target = spans.find((s) => {
        const t = s.textContent.trim()
        return t && t !== '|' && (t === wantText || t.includes(wantText))
      })
    }
    if (!target) {
      target = spans.find((s) => {
        const t = s.textContent.trim()
        return t && t !== '|' && t.length > 0
      })
    }
    if (!target) return null
    const btn = target.closest('button') || target.closest('[data-slot="command-item"]') || target.parentElement
    btn?.click()
    return target.textContent.trim()
  }, want || null)

  await sleep(700)
  await page.keyboard.press('Escape').catch(() => {})
  await sleep(300)
  return picked
}

async function typeField(page, sel, value) {
  await page.waitForSelector(sel, { visible: true, timeout: 10000 })
  const el = await page.$(sel)
  await el.click({ clickCount: 3 })
  await el.press('Backspace')
  await el.type(String(value), { delay: 8 })
}

async function clickSection(page, label) {
  await page.evaluate((text) => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find((b) => b.offsetParent !== null && (b.textContent || '').includes(text))
    if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click() }
  }, label)
  await sleep(1200)
}

async function enableToggle(page, labelPattern) {
  return page.evaluate((pat) => {
    const re = new RegExp(pat)
    const switches = Array.from(document.querySelectorAll('[role="switch"]'))
    const sw = switches.find((x) => {
      const row = x.closest('div') || x.parentElement
      const ctx = (row?.textContent || '').replace(/\s+/g, ' ')
      return re.test(ctx) && !/YYYY-MM-DD/.test(ctx.slice(0, 80)) && x.offsetParent !== null
    })
    if (!sw) return false
    if (sw.getAttribute('data-state') !== 'checked') sw.click()
    return sw.getAttribute('data-state') === 'checked'
  }, labelPattern)
}

async function fillTemplateAttributes(page) {
  await clickSection(page, 'คุณสมบัติ')
  await sleep(2000)
  return page.evaluate(() => {
    let count = 0
    const inputs = Array.from(document.querySelectorAll('input, textarea'))
      .filter((e) => e.offsetParent !== null && !e.readOnly && !e.disabled)
      .filter((e) => !['sku', 'translations.0.name', 'translations.1.name'].some((x) => (e.name || '').includes(x)))

    for (const el of inputs) {
      const type = (el.getAttribute('type') || 'text').toLowerCase()
      if (type === 'checkbox' || type === 'file') continue
      if (el.value && String(el.value).trim()) continue
      if (type === 'number') {
        el.value = '1'
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
        count++
      } else if (el.tagName === 'TEXTAREA' || type === 'text') {
        el.value = 'ทดสอบ'
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
        count++
      }
    }
    return count
  })
}

async function fillInventorySection(page, { stock, lowStock, price }) {
  await clickSection(page, 'คลังสินค้าและราคา')
  await sleep(2000)

  for (const [sel, val] of [
    ['input[name="configWebStock"]', stock],
    ['input[name="lowStockThreshold"]', lowStock],
    ['input[name="priceConfig"]', price],
  ]) {
    try { await typeField(page, sel, val) } catch { /* field optional */ }
  }

  await enableToggle(page, 'การแสดงผลบนเว็บไซต์')
  await enableToggle(page, 'การเปิดขาย')
  await sleep(500)
}

async function saveWithRetry(page, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button[type="submit"], button'))
        .find((b) => b.offsetParent !== null && (b.textContent || '').trim() === 'บันทึก')
      if (btn) { btn.scrollIntoView({ block: 'center' }); btn.click() }
    })
    await sleep(i === 0 ? 6000 : 8000)

    const url = page.url()
    const onList = /\/products\/?$/.test(new URL(url).pathname) || url.endsWith('/products')
    if (onList) return { ok: true, url, attempts: i + 1 }
  }
  return { ok: false, url: page.url(), attempts: maxAttempts }
}

async function createProductE2E(page, overrides = {}) {
  const ts = Date.now()
  const sku = overrides.sku || `AUTO-${ts}`
  const name = overrides.name || `สินค้าทดสอบอัตโนมัติ ${ts}`
  const enName = overrides.enName || `Auto Product ${ts}`
  const meta = { brand: null, cat1: null, cat2: null, cat3: null, attributesFilled: 0 }

  await clickSection(page, 'ข้อมูลทั่วไป')
  await typeField(page, 'input[name="sku"]', sku)
  await typeField(page, 'input[name="translations.0.name"]', name)

  const enLocked = await page.evaluate(() => document.querySelector('input[name="translations.1.name"]')?.disabled)
  if (enLocked) {
    await page.evaluate(() => {
      const sw = Array.from(document.querySelectorAll('[role="switch"]'))
        .find((x) => /ใช้เหมือนกัน/.test(x.closest('label,div,p')?.textContent || ''))
      if (sw) sw.click()
    })
    await sleep(400)
  }
  await typeField(page, 'input[name="translations.1.name"]', enName)

  meta.brand = await pickSearchable(page, TRIGGER.brand, overrides.brand || DEFAULTS.brand)
  await pickSearchable(page, TRIGGER.warranty, null).catch(() => null)

  meta.cat1 = await pickSearchable(page, TRIGGER.cat1, overrides.cat1 || DEFAULTS.cat1)
  await sleep(800)
  meta.cat2 = await pickSearchable(page, TRIGGER.cat2, overrides.cat2 || DEFAULTS.cat2)
  await sleep(800)
  meta.cat3 = await pickSearchable(page, TRIGGER.cat3, overrides.cat3 || null)

  meta.attributesFilled = await fillTemplateAttributes(page)

  await fillInventorySection(page, {
    stock: overrides.stock ?? DEFAULTS.stock,
    lowStock: overrides.lowStock ?? DEFAULTS.lowStock,
    price: overrides.price ?? DEFAULTS.price,
  })

  const save = await saveWithRetry(page, overrides.saveAttempts ?? 3)
  return { ok: save.ok, sku, name, enName, url: save.url, attempts: save.attempts, meta }
}

module.exports = {
  DEFAULTS,
  TRIGGER,
  pickSearchable,
  createProductE2E,
  fillInventorySection,
  fillTemplateAttributes,
  saveWithRetry,
}
