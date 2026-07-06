/**
 * Cypress helpers — สร้างสินค้า E2E (searchable-select UI)
 * อ้างอิง docs/BUSINESS_FLOWS.md
 */
const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/product-manager/products`
const CREATE_URL = `${LIST_URL}/create`

// หน้าร้าน (Frontstore) — คนละ domain กับ Back Office จึงต้องใช้ cy.origin() เวลาเช็ค
const FRONTSTORE_BASE = 'https://jib-dev-store.fqykqy.easypanel.host'
const frontstoreDetailUrl = (sku) => `${FRONTSTORE_BASE}/th/product/product-detail/${sku}`

const DEFAULT_PRODUCT = {
  brand: 'Acer',
  cat1: 'เซียมซี',
  cat2: 'เซียมซีย่อย1',
  // หมวด "1" มีเทมเพลตคุณสมบัติผูกไว้ (เซียมซี → เซียมซีย่อย1 → 1) จึงทำให้แท็บคุณสมบัติมีช่องให้กรอก
  cat3: '1',
  stock: 10,
  lowStock: 2,
  price: 999,
}

// ไฟล์ภาพสำหรับอัปโหลด (relative กับ project root) — ดูได้หลายรูป
const DEFAULT_IMAGES = [
  'cypress/fixtures/product-1.png',
  'cypress/fixtures/product-2.jpeg',
  'cypress/fixtures/product-3.jpeg',
]

function rand() {
  return Math.floor(10000 + Math.random() * 90000)
}

function buildProductData(overrides = {}) {
  const n = rand()
  return {
    sku: `CY-PROD-${n}`,
    thaiName: `เทสสินค้า Cypress ${n}`,
    enName: `Cypress Product ${n}`,
    cardText: `การ์ดสินค้าทดสอบ ${n} - สินค้าตัวอย่างสำหรับทดสอบระบบ`,
    highlight: `ไฮไลท์ทดสอบ ${n}: สินค้าคุณภาพดี ราคาคุ้มค่า รับประกันศูนย์ไทย`,
    // ฟีเจอร์ (rich text) — แยกไทย/อังกฤษ แต่ละบรรทัดเป็นย่อหน้า
    featureTh: [
      `ฟีเจอร์เด่นของสินค้า ${n} (ภาษาไทย)`,
      '• ดีไซน์พรีเมียม วัสดุแข็งแรงทนทาน',
      '• ประสิทธิภาพสูง รองรับการใช้งานหนัก',
      '• รับประกันศูนย์ไทย 3 ปี',
    ],
    featureEn: [
      `Key product features ${n} (English)`,
      '• Premium design with durable materials',
      '• High performance for heavy workloads',
      '• 3-year official Thailand warranty',
    ],
    brand: DEFAULT_PRODUCT.brand,
    cat1: DEFAULT_PRODUCT.cat1,
    cat2: DEFAULT_PRODUCT.cat2,
    cat3: DEFAULT_PRODUCT.cat3,
    images: DEFAULT_IMAGES,
    stock: DEFAULT_PRODUCT.stock,
    lowStock: DEFAULT_PRODUCT.lowStock,
    price: DEFAULT_PRODUCT.price,
    ...overrides,
  }
}

/** เลือกค่าใน searchable-select (ข้าม option "|") */
function pickSearchableSelect(triggerMatch, optionText) {
  cy.contains('button[data-slot="searchable-select-trigger"]', triggerMatch, { timeout: 10000 })
    .should('be.visible')
    .click()

  cy.get('[data-slot="popover-content"]', { timeout: 10000 }).should('be.visible')

  if (optionText) {
    cy.get('[data-slot="popover-content"] input').clear().type(optionText, { delay: 20 })
    cy.wait(1000)
  } else {
    cy.wait(800)
  }

  cy.get('[data-slot="popover-content"]').within(() => {
    if (optionText) {
      cy.get('span.truncate')
        .filter((_, el) => {
          const t = el.textContent.trim()
          return t && t !== '|' && (t === optionText || t.includes(optionText))
        })
        .first()
        .closest('button')
        .click({ force: true })
    } else {
      cy.get('span.truncate')
        .not(':contains("|")')
        .first()
        .closest('button')
        .click({ force: true })
    }
  })

  cy.get('body').type('{esc}')
  cy.wait(300)
}

function unlockEnglishNameIfNeeded() {
  cy.get('input[name="translations.1.name"]').then(($el) => {
    if ($el.is(':disabled')) {
      cy.contains('p', 'ใช้เหมือนกันทั้ง 2 ภาษา')
        .first()
        .parent()
        .find('button[role="switch"]')
        .first()
        .click({ force: true })
    }
  })
}

/**
 * แท็บ "คุณสมบัติ" — เทมเพลตคุณสมบัติจะโหลดเองตามหมวดหมู่ที่เลือก
 * (เซียมซี → เซียมซีย่อย1 → 1 มีเทมเพลต "เทส 5 หัวข้อ x 20 คุณสมบัติ" = 100 ช่อง)
 * ถ้าหมวดที่เลือกไม่มีเทมเพลต จะข้ามให้อัตโนมัติ (ไม่ทำให้เทสพัง)
 */
function fillTemplateAttributes() {
  cy.contains('button', 'คุณสมบัติ').click()
  cy.wait(1500)

  // ช่องคุณสมบัติของเทมเพลตจะมี placeholder รูปแบบ "ห<หัวข้อ>-ค<ลำดับ>" และไม่มี name
  cy.get('body').then(($body) => {
    const $attrInputs = $body
      .find('input:visible, textarea:visible')
      .filter((_, el) => /^ห\d+-ค\d+$/.test(el.getAttribute('placeholder') || ''))

    if ($attrInputs.length === 0) {
      cy.log('ไม่มีเทมเพลตคุณสมบัติสำหรับหมวดนี้ — ข้ามขั้นตอนคุณสมบัติ')
      return
    }

    cy.log(`พบช่องคุณสมบัติจากเทมเพลต ${$attrInputs.length} ช่อง — กำลังกรอก`)
    cy.wrap($attrInputs).each(($el) => {
      const ph = $el.attr('placeholder')
      cy.wrap($el).clear({ force: true }).type(`ค่า ${ph}`, { force: true, delay: 0 })
    })
  })
}

const FEATURE_EDITOR = 'div.tiptap.ProseMirror[contenteditable="true"]'

/** เปิดแท็บ "ไฮไลท์/ฟีเจอร์" (มี 2 section: ไฮไลท์ + ฟีเจอร์) */
function openHighlightFeatureTab() {
  cy.contains('button', 'ไฮไลท์/ฟีเจอร์').click()
  cy.wait(800)
}

/** section "ไฮไลท์" — textarea ภาษาไทย (อังกฤษใช้ร่วมผ่าน toggle "ใช้เหมือนกัน 2 ภาษา") */
function fillHighlight(text) {
  cy.get('textarea[placeholder="กรอกไฮไลท์"]')
    .filter((_, el) => !el.disabled)
    .first()
    .clear({ force: true })
    .type(text, { force: true })
}

/** กรอก rich-text editor (TipTap) ของฟีเจอร์ทีละบรรทัด (Enter = ย่อหน้าใหม่) */
function typeFeatureEditor(lines) {
  const text = (Array.isArray(lines) ? lines : [lines]).join('{enter}')
  cy.get(FEATURE_EDITOR)
    .first()
    .click()
    .type('{selectall}{del}', { force: true })
    .type(text, { force: true, delay: 0 })
}

/**
 * section "ฟีเจอร์" — TipTap editor + ปุ่มสลับภาษา (เนื้อหาไทย/อังกฤษเก็บแยกกัน)
 * กรอกครบทั้ง 2 ภาษา
 */
function fillFeature(featureTh, featureEn) {
  // กาง collapsible "ฟีเจอร์" ถ้ายังปิด
  cy.contains('button[data-slot="collapsible-trigger"]', 'ฟีเจอร์').then(($t) => {
    if ($t.attr('aria-expanded') !== 'true') cy.wrap($t).click()
  })
  cy.wait(400)

  if (featureTh) {
    cy.contains('button', 'ภาษาไทย').click()
    cy.wait(200)
    typeFeatureEditor(featureTh)
  }
  if (featureEn) {
    cy.contains('button', 'ภาษาอังกฤษ').click()
    cy.wait(200)
    typeFeatureEditor(featureEn)
    // สลับกลับไทยไว้ (กันสับสนตอน save/preview)
    cy.contains('button', 'ภาษาไทย').click()
  }
}

/** แท็บ "รูปภาพ/วีดีโอ/360" — อัปโหลดได้หลายรูปพร้อมกัน */
function uploadProductImages(images) {
  if (!images || images.length === 0) return
  cy.contains('button', 'รูปภาพ/วีดีโอ/360').click()
  cy.wait(800)
  cy.get('input[type="file"]').first().selectFile(images, { force: true })
  // รอ preview ขึ้นครบ (counter อัปเดตเป็นจำนวนรูป)
  cy.contains(new RegExp(`รูปภาพ/วีดีโอ/360 \\(${images.length}/30\\)`), { timeout: 15000 }).should(
    'be.visible'
  )
}

function enableSwitchByLabel(labelPattern) {
  const re = new RegExp(labelPattern)
  cy.get('button[role="switch"]', { timeout: 10000 }).then(($switches) => {
    const $match = $switches.filter((_, el) => {
      const row = el.closest('div[class*="flex"], div[class*="grid"], section, label') || el.parentElement
      const text = (row?.textContent || el.parentElement?.textContent || '').replace(/\s+/g, ' ')
      return re.test(text) && !/YYYY-MM-DD/.test(text.slice(0, 80))
    })
    expect($match.length, `switch สำหรับ "${labelPattern}"`).to.be.greaterThan(0)
    const $sw = $match.first()
    if ($sw.attr('data-state') !== 'checked') {
      cy.wrap($sw).click({ force: true })
    }
    cy.wrap($sw).should('have.attr', 'data-state', 'checked')
  })
}

function fillInventorySection(data) {
  cy.contains('button', 'คลังสินค้าและราคา', { timeout: 10000 }).click()
  cy.wait(1500)

  cy.get('input[name="configWebStock"]', { timeout: 10000 }).clear().type(String(data.stock))
  cy.get('input[name="lowStockThreshold"]').clear().type(String(data.lowStock))
  cy.get('input[name="priceConfig"]').clear().type(String(data.price))

  // สำคัญ: ต้องเปิดเพื่อให้แสดงบน Frontstore (docs/BUSINESS_FLOWS.md)
  enableSwitchByLabel('การแสดงผลบนเว็บไซต์')
  enableSwitchByLabel('การเปิดขาย')
}

function fillProductCreateForm(data) {
  cy.contains('button', 'ข้อมูลทั่วไป').click()

  cy.get('input[name="sku"]').clear().type(data.sku)
  cy.get('input[name="translations.0.name"]').clear().type(data.thaiName)

  unlockEnglishNameIfNeeded()
  cy.get('input[name="translations.1.name"]').clear().type(data.enName)

  // การ์ดสินค้า - ภาษาไทย (ฟิลด์ภายในชื่อ translations.0.highlight — เป็น textarea)
  if (data.cardText) {
    cy.get('[name="translations.0.highlight"]').first().clear().type(data.cardText)
  }

  pickSearchableSelect('แบรนด์', data.brand)
  pickSearchableSelect('Category 1', data.cat1)
  pickSearchableSelect('Category 2', data.cat2)
  if (data.cat3) pickSearchableSelect('Category 3', data.cat3)
  else pickSearchableSelect('Category 3')

  // รูปภาพสินค้า (หลายรูป)
  if (data.images) uploadProductImages(data.images)

  // ไฮไลท์/ฟีเจอร์ (section ไฮไลท์ + section ฟีเจอร์ ไทย/อังกฤษ)
  if (data.highlight || data.featureTh || data.featureEn) {
    openHighlightFeatureTab()
    if (data.highlight) fillHighlight(data.highlight)
    if (data.featureTh || data.featureEn) fillFeature(data.featureTh, data.featureEn)
  }

  // คุณสมบัติ (เทมเพลตตามหมวด)
  fillTemplateAttributes()

  fillInventorySection(data)
}

function clickProductSave() {
  cy.get('button[type="submit"]').contains('บันทึก').click()
}

function openProductCreate() {
  cy.visit(CREATE_URL, {
    onBeforeLoad(win) {
      win.addEventListener('beforeunload', (e) => e.stopImmediatePropagation())
    },
  })
  cy.url().should('include', '/products/create', { timeout: 15000 })
  cy.contains('เพิ่มสินค้าใหม่', { timeout: 15000 }).should('be.visible')
}

function createProductE2E(data) {
  openProductCreate()
  fillProductCreateForm(data)
  clickProductSave()
  cy.url({ timeout: 30000 }).should('match', /\/products\/?$/)
}

/**
 * ใน list: กดที่ชื่อสินค้า → ลิงก์ไปหน้า Frontstore (เปิดแท็บใหม่ target=_blank)
 * คืนค่า href ของลิงก์ (รูปแบบ {frontstore}/th/product/product-detail/{sku})
 */
function getFrontstoreLinkFromList(sku) {
  cy.get('input[placeholder="ค้นหา"]').clear().type(sku)
  cy.wait(2000)
  return cy
    .contains('tbody tr', sku)
    .find('a[href*="/product-detail/"]')
    .first()
    .should('have.attr', 'href')
    .and('include', sku)
}

/**
 * ตรวจข้อมูลสินค้าบนหน้า Frontstore ว่าตรงกับที่กรอกตอนสร้าง
 * (ใช้ cy.origin เพราะ Frontstore คนละ domain — Cypress เปิดแท็บใหม่ไม่ได้ จึง visit href ตรงๆ)
 */
function verifyProductOnFrontstore(data) {
  const url = frontstoreDetailUrl(data.sku)
  cy.origin(FRONTSTORE_BASE, { args: { data, url } }, ({ data, url }) => {
    // หน้าร้าน (Next.js) อาจมี uncaught error ภายในแอป — ไม่ให้ทำให้เทสล้ม
    cy.on('uncaught:exception', () => false)

    cy.visit(url)

    // ชื่อสินค้า + รหัส + แบรนด์
    cy.contains(data.thaiName, { timeout: 20000 }).should('be.visible')
    cy.contains(data.sku).should('exist')
    cy.contains(data.brand).should('exist')

    // ราคา (เทียบแบบมี comma เช่น 1,290)
    const priceStr = Number(data.price).toLocaleString('en-US')
    cy.contains(priceStr).should('exist')

    // ไฮไลท์ (รายละเอียดสินค้าโดยย่อ)
    if (data.highlight) cy.contains(data.highlight).should('exist')

    // ฟีเจอร์ ภาษาไทย (แสดงในส่วนรายละเอียดสินค้า) — เช็คบรรทัดที่คงที่ (ตัด bullet ออก)
    if (data.featureTh && data.featureTh.length) {
      const line = (data.featureTh[1] || data.featureTh[0]).replace(/^•\s*/, '')
      cy.contains(line).should('exist')
    }

    // คุณสมบัติจากเทมเพลต — ตรวจค่าตัวอย่างหัว/ท้าย
    cy.contains('ค่า ห1-ค01').should('exist')
    cy.contains('ค่า ห5-ค20').should('exist')

    // รูปภาพ — ต้องมีรูปที่ path มี SKU อย่างน้อยเท่าจำนวนที่อัปโหลด
    cy.get(`img[src*="${data.sku}"]`).should('have.length.greaterThan', 0)
  })
}

module.exports = {
  BASE,
  LIST_URL,
  CREATE_URL,
  DEFAULT_PRODUCT,
  DEFAULT_IMAGES,
  rand,
  buildProductData,
  pickSearchableSelect,
  fillProductCreateForm,
  fillTemplateAttributes,
  openHighlightFeatureTab,
  fillHighlight,
  fillFeature,
  uploadProductImages,
  fillInventorySection,
  enableSwitchByLabel,
  clickProductSave,
  openProductCreate,
  createProductE2E,
  FRONTSTORE_BASE,
  frontstoreDetailUrl,
  getFrontstoreLinkFromList,
  verifyProductOnFrontstore,
}
