const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/product-manager/products`
const CREATE_URL = `${LIST_URL}/create`

const {
  buildProductData,
  pickSearchableSelect,
  fillProductCreateForm,
  openProductCreate,
  clickProductSave,
} = require('../support/product-helpers')

// หมายเหตุ: หน้า "สินค้า" ซับซ้อนที่สุดในระบบ — E2E create ครบ flow ดู product-e2e-create.cy.js
describe('จัดการสินค้า (Product)', () => {

  beforeEach(() => {
    cy.session('jib-admin', () => {
      cy.loginJIB('sirun.sun@codelabdev.co', 'test123')
    })
    cy.visit(LIST_URL, {
      onBeforeLoad(win) {
        // ปิด beforeunload dialog จาก form unsaved-state
        win.addEventListener('beforeunload', (e) => {
          e.stopImmediatePropagation()
        })
      }
    })
    cy.contains('p', 'สินค้า', { timeout: 15000 }).should('be.visible')
  })

  // ---------- helpers ----------

  const openCreate = openProductCreate

  const rand = () => Math.floor(10000 + Math.random() * 90000)

  const pickSelect = pickSearchableSelect

  const fillCreateRequired = fillProductCreateForm

  const buildProductDataLocal = buildProductData

  // เปิด edit page ของ row แรกในตาราง (รอ table load)
  const openFirstEdit = () => {
    cy.get('tbody tr a[href*="/products/update/"]', { timeout: 20000 })
      .first().click()
    cy.url().should('include', '/products/update/', { timeout: 15000 })
    cy.contains('แก้ไข', { timeout: 15000 }).should('be.visible')
  }

  const clickSave = clickProductSave

  const closeSheet = () => {
    cy.get('body').type('{esc}')
    cy.get('[role="dialog"]').should('not.exist')
  }

  // ===========================================================
  // 1) LIST page UI
  // ===========================================================
  describe('หน้า list', () => {
    it('แสดงชื่อหน้าและจำนวน record', () => {
      cy.contains('p', 'สินค้า').should('be.visible')
      cy.contains('จัดการสินค้า').should('be.visible')
      cy.contains(/รายการ/).should('be.visible')
    })

    it('ตารางมีคอลัมน์หลัก (SKU, สินค้า, สถานะสินค้า, แบรนด์)', () => {
      cy.get('thead').should('contain.text', 'SKU')
      cy.get('thead').should('contain.text', 'สินค้า')
      cy.get('thead').should('contain.text', 'สถานะสินค้า')
      cy.get('thead').should('contain.text', 'แบรนด์')
    })

    it('แสดง quick filter tabs (สินค้าใหม่, ทั้งหมด, สินค้าปกติ)', () => {
      cy.contains('สินค้าใหม่').should('be.visible')
      cy.contains('ทั้งหมด').should('be.visible')
      cy.contains('สินค้าปกติ').should('be.visible')
      cy.contains('สินค้าตัวเลือก').should('be.visible')
      cy.contains('สินค้าพรีออเดอร์').should('be.visible')
    })

    it('แสดงปุ่ม "เพิ่มสินค้า", "ตัวกรอง", "ปรับแต่งคอลัมน์"', () => {
      cy.contains('button', 'เพิ่มสินค้า').should('be.visible')
      cy.contains('button', 'ตัวกรอง').should('be.visible')
      cy.contains('button', 'ปรับแต่งคอลัมน์').should('be.visible')
    })

    it('ช่องค้นหาแสดงและพิมพ์ได้', () => {
      cy.get('input[placeholder="ค้นหา"]').should('be.visible').type('test')
        .should('have.value', 'test')
    })

    it('Default แสดงไม่เกิน 10 แถว', () => {
      cy.get('tbody tr').its('length').should('be.lte', 10)
    })
  })

  // ===========================================================
  // 2) QUICK FILTER TABS
  // ===========================================================
  describe('Quick Filter Tabs', () => {
    const tabs = [
      'สินค้าใหม่',
      'ทั้งหมด',
      'สินค้าปกติ',
      'สินค้าตัวเลือก',
      'สินค้าชิ้นส่วนประกอบคอมพิวเตอร์',
      'คอมพิวเตอร์เซ็ต',
      'สินค้าซอฟต์แวร์/ดิจิทัล',
      'สินค้าพรีออเดอร์',
      'สินค้าฝากขาย',
    ]

    tabs.forEach((tab) => {
      it(`คลิก tab "${tab}" → ทำงานได้`, () => {
        cy.contains(tab).first().click()
        cy.wait(1500)
        // table ต้อง render
        cy.get('thead').should('be.visible')
      })
    })
  })

  // ===========================================================
  // 3) SEARCH
  // ===========================================================
  describe('ค้นหา', () => {
    it('ค้นหา SKU → URL อัปเดต', () => {
      cy.get('input[placeholder="ค้นหา"]').clear().type('W1336A')
      cy.url({ timeout: 5000 }).should('include', 'search=')
      cy.wait(1500)
    })

    it('ค้นหา keyword ไม่มี → ตารางว่าง', () => {
      const fake = `nx-${Date.now()}`
      cy.get('input[placeholder="ค้นหา"]').clear().type(fake)
      cy.wait(2000)
      cy.get('tbody tr').should('have.length.lte', 1)
    })

    it('ล้าง search → กลับมาเห็นข้อมูล', () => {
      cy.get('input[placeholder="ค้นหา"]').clear().type('test')
      cy.wait(1500)
      cy.get('input[placeholder="ค้นหา"]').clear()
      cy.wait(1500)
      cy.get('tbody tr').its('length').should('be.gte', 1)
    })
  })

  // ===========================================================
  // 4) FILTER Sheet
  // ===========================================================
  describe('Filter Sheet', () => {
    it('เปิด filter sheet → แสดง title "ตัวกรอง"', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').should('be.visible')
      cy.contains('[role="dialog"] h2, [role="dialog"]', 'ตัวกรอง').should('exist')
      closeSheet()
    })

    it('Filter sheet มีตัวเลือกหลายรายการ (จากหมวดหมู่)', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').within(() => {
        cy.get('button[role="checkbox"], label').its('length').should('be.gte', 3)
      })
      closeSheet()
    })
  })

  // ===========================================================
  // 5) CUSTOMIZE COLUMNS
  // ===========================================================
  describe('ปรับแต่งคอลัมน์', () => {
    it('เปิด menu → แสดง options', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.get('[role="menuitemcheckbox"]', { timeout: 5000 }).should('have.length.at.least', 10)
      cy.get('body').type('{esc}')
    })

    it('Menu มี option หลักครบ (SKU, สินค้า, แบรนด์)', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.contains('[role="menuitemcheckbox"]', 'SKU').should('be.visible')
      cy.contains('[role="menuitemcheckbox"]', 'สินค้า').should('be.visible')
      cy.contains('[role="menuitemcheckbox"]', 'แบรนด์').should('be.visible')
      cy.get('body').type('{esc}')
    })

    it('ซ่อนคอลัมน์ "Supplier" → header หาย', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.contains('[role="menuitemcheckbox"]', /^Supplier$/).click()
      cy.get('body').type('{esc}')
      cy.get('thead').should('not.contain.text', /^Supplier$/)
    })
  })

  // ===========================================================
  // 6) BULK SELECTION
  // ===========================================================
  describe('Bulk select', () => {
    it('ติ๊ก checkbox row แรก', () => {
      cy.get('tbody tr:first-child button[role="checkbox"]').click({ force: true })
      cy.get('tbody tr:first-child button[role="checkbox"]')
        .should('have.attr', 'data-state', 'checked')
    })
  })

  // ===========================================================
  // 7) PAGINATION
  // ===========================================================
  describe('Pagination', () => {
    it('เปลี่ยนจำนวนแถว → 20', () => {
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').click()
      cy.contains('[role="option"]', '20').click()
      cy.get('tbody tr', { timeout: 10000 }).its('length').should('be.lte', 20)
    })

    it('เปลี่ยนจำนวนแถว → 50', () => {
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').click()
      cy.contains('[role="option"]', '50').click()
      cy.get('tbody tr', { timeout: 10000 }).its('length').should('be.lte', 50)
    })

    it('คลิกหน้า 2', () => {
      cy.contains('nav a, [role="navigation"] a', '2').first().click()
      cy.wait(1500)
      cy.get('tbody tr').its('length').should('be.gte', 1)
    })
  })

  // ===========================================================
  // 8) CREATE — Page structure
  // ===========================================================
  describe('หน้า create', () => {
    beforeEach(() => openCreate())

    it('แสดงชื่อหน้า "เพิ่มสินค้าใหม่"', () => {
      cy.contains('เพิ่มสินค้าใหม่').should('be.visible')
    })

    it('มี section tabs ครบ 8 (ข้อมูลทั่วไป, รูปภาพ, ไฮไลท์, คุณสมบัติ, คลังสินค้าและราคา, แท็กสินค้า, ตัวกรองสินค้า, SEO)', () => {
      const tabs = [
        'ข้อมูลทั่วไป',
        'รูปภาพ/วีดีโอ/360',
        'ไฮไลท์/ฟีเจอร์',
        'คุณสมบัติ',
        'คลังสินค้าและราคา',
        'แท็กสินค้า',
        'ตัวกรองสินค้า',
        'SEO',
      ]
      tabs.forEach((t) => {
        cy.contains('button', t).should('be.visible')
      })
    })

    it('มี language tabs (ไทย/Eng)', () => {
      cy.contains('button', 'ไทย').should('be.visible')
      cy.contains('button', 'Eng').should('be.visible')
    })

    it('แสดงปุ่ม "ดูตัวอย่าง" และ "บันทึก"', () => {
      cy.contains('button', 'ดูตัวอย่าง').should('be.visible')
      cy.contains('button', 'บันทึก').should('be.visible')
    })

    it('Required fields แสดง * (SKU, แบรนด์, หมวดหมู่ × 3, ชื่อ × 2)', () => {
      cy.contains('label', 'SKU').should('contain.text', '*')
      cy.contains('label', 'แบรนด์').should('contain.text', '*')
      cy.contains('label', 'หมวดหมู่หลัก').should('contain.text', '*')
      cy.contains('label', 'หมวดหมู่รอง').should('contain.text', '*')
      cy.contains('label', 'หมวดหมู่สินค้า').should('contain.text', '*')
      cy.contains('label', 'ชื่อสินค้า - ภาษาไทย').should('contain.text', '*')
      cy.contains('label', 'ชื่อสินค้า - ภาษาอังกฤษ').should('contain.text', '*')
    })
  })

  // ===========================================================
  // 9) CREATE — Validation
  // ===========================================================
  describe('Validation ตอนสร้าง', () => {
    beforeEach(() => openCreate())

    it('กดบันทึกฟอร์มว่าง → 5 errors แสดง', () => {
      clickSave()
      cy.contains('กรุณากรอกรหัสสินค้า').should('be.visible')
      cy.contains('กรุณาเลือกแบรนด์').should('be.visible')
      cy.contains('กรุณาเลือกหมวดหมู่').should('be.visible')
      cy.contains('กรุณากรอกชื่อสินค้า').should('be.visible')
      cy.url().should('include', '/products/create')
    })

    it('ไม่กรอก SKU → error "กรุณากรอกรหัสสินค้า"', () => {
      cy.get('input[name="translations.0.name"]').type('test name TH')
      cy.get('input[name="translations.1.name"]').type('test name EN')
      clickSave()
      cy.contains('กรุณากรอกรหัสสินค้า').should('be.visible')
      cy.url().should('include', '/products/create')
    })

    it('ไม่กรอกชื่อ TH → error "กรุณากรอกชื่อสินค้า"', () => {
      cy.get('input[name="sku"]').type('TEST-SKU-001')
      cy.get('input[name="translations.1.name"]').type('test name EN')
      clickSave()
      cy.contains('กรุณากรอกชื่อสินค้า').should('be.visible')
      cy.url().should('include', '/products/create')
    })

    it('ไม่เลือกแบรนด์/หมวดหมู่ → error แสดง', () => {
      cy.get('input[name="sku"]').type('TEST-SKU-002')
      cy.get('input[name="translations.0.name"]').type('test name TH')
      cy.get('input[name="translations.1.name"]').type('test name EN')
      clickSave()
      cy.contains('กรุณาเลือกแบรนด์').should('be.visible')
      cy.contains('กรุณาเลือกหมวดหมู่').should('be.visible')
      cy.url().should('include', '/products/create')
    })
  })

  // ===========================================================
  // 10) CREATE — Cascading dropdowns
  // ===========================================================
  describe('Cascading dropdowns (หมวดหมู่)', () => {
    beforeEach(() => openCreate())

    it('หมวดหมู่รอง disabled จนกว่าจะเลือกหมวดหมู่หลัก', () => {
      cy.contains('button[data-slot="searchable-select-trigger"]', 'Category 2')
        .should('be.disabled')
    })

    it('หมวดหมู่สินค้า disabled จนกว่าจะเลือกหมวดหมู่รอง', () => {
      cy.contains('button[data-slot="searchable-select-trigger"]', 'Category 3')
        .should('be.disabled')
    })

    it('เลือกหมวดหมู่หลัก → หมวดหมู่รอง enable', () => {
      pickSelect('Category 1', 'เซียมซี')
      cy.contains('button[data-slot="searchable-select-trigger"]', 'Category 2')
        .should('not.be.disabled')
    })

    it('แบรนด์ dropdown มีตัวเลือก', () => {
      cy.contains('button[data-slot="searchable-select-trigger"]', 'แบรนด์').click()
      cy.get('[data-slot="popover-content"] span.truncate').its('length').should('be.gte', 1)
      cy.get('body').type('{esc}')
    })
  })

  // ===========================================================
  // 11) CREATE — Section tabs (สลับ tab)
  // ===========================================================
  describe('Form section tabs', () => {
    beforeEach(() => openCreate())

    it('สลับ tab "รูปภาพ/วีดีโอ/360"', () => {
      cy.contains('button', 'รูปภาพ/วีดีโอ/360').click()
      cy.wait(500)
    })

    it('สลับ tab "ไฮไลท์/ฟีเจอร์"', () => {
      cy.contains('button', 'ไฮไลท์/ฟีเจอร์').click()
      cy.wait(500)
    })

    it('สลับ tab "คุณสมบัติ"', () => {
      cy.contains('button', 'คุณสมบัติ').click()
      cy.wait(500)
    })

    it('สลับ tab "คลังสินค้าและราคา"', () => {
      cy.contains('button', 'คลังสินค้าและราคา').click()
      cy.wait(500)
    })

    it('สลับ tab "แท็กสินค้า"', () => {
      cy.contains('button', 'แท็กสินค้า').click()
      cy.wait(500)
    })

    it('สลับ tab "ตัวกรองสินค้า"', () => {
      cy.contains('button', 'ตัวกรองสินค้า').click()
      cy.wait(500)
    })

    it('สลับ tab "SEO"', () => {
      cy.contains('button', 'SEO').click()
      cy.wait(500)
    })

    it('สลับ language Eng', () => {
      cy.contains('button', 'Eng').click()
      cy.wait(500)
    })
  })

  // ===========================================================
  // 12) CREATE — Character counter / max length
  // ===========================================================
  describe('Form input behavior', () => {
    beforeEach(() => openCreate())

    it('ช่อง SKU พิมพ์ได้', () => {
      cy.get('input[name="sku"]').type('SKU-TEST-123')
        .should('have.value', 'SKU-TEST-123')
    })

    it('ช่องชื่อ TH พิมพ์ได้', () => {
      cy.get('input[name="translations.0.name"]').type('ทดสอบสินค้าไทย')
        .should('have.value', 'ทดสอบสินค้าไทย')
    })

    it('ช่องชื่อ EN พิมพ์ได้', () => {
      cy.get('input[name="translations.1.name"]').type('Test Product EN')
        .should('have.value', 'Test Product EN')
    })

    it('Toggle "ใช้เหมือนกันทั้ง 2 ภาษา" คลิกได้', () => {
      cy.contains('p', 'ใช้เหมือนกันทั้ง 2 ภาษา').first().parent().find('button[role="switch"]')
        .first().click({ force: true })
    })

    it('Toggle "สินค้าตัวเลือก" คลิกได้', () => {
      cy.contains('p', 'สินค้าตัวเลือก').parent().parent().find('button[role="switch"]')
        .first().click({ force: true })
    })
  })

  // ===========================================================
  // 13) EDIT — เปิด record ที่มีอยู่
  // ===========================================================
  describe('แก้ไขสินค้า', () => {
    it('เปิด edit page → load form ข้อมูลเดิม', () => {
      cy.get('tbody tr:first-child a[href*="/products/update/"]').click()
      cy.url().should('include', '/products/update/')
      cy.contains('แก้ไข', { timeout: 15000 }).should('be.visible')
      cy.get('input[name="sku"]').should('have.value').and('not.be.empty')
    })

    it('Edit page มี section tabs ครบ', () => {
      cy.get('tbody tr:first-child a[href*="/products/update/"]').click()
      cy.contains('แก้ไข', { timeout: 15000 }).should('be.visible')
      cy.contains('button', 'ข้อมูลทั่วไป').should('be.visible')
      cy.contains('button', 'รูปภาพ/วีดีโอ/360').should('be.visible')
      cy.contains('button', 'SEO').should('be.visible')
    })

    it('Edit page มี toggle "ฉบับร่าง" และปุ่ม "บันทึก"', () => {
      cy.get('tbody tr:first-child a[href*="/products/update/"]').click()
      cy.contains('แก้ไข', { timeout: 15000 }).should('be.visible')
      cy.contains('ฉบับร่าง').should('be.visible')
      cy.contains('button', 'บันทึก').should('be.visible')
      cy.contains('button', 'ดูตัวอย่าง').should('be.visible')
    })

    it('แสดง preview card สินค้าด้านซ้าย', () => {
      cy.get('tbody tr:first-child a[href*="/products/update/"]').click()
      cy.contains('แก้ไข', { timeout: 15000 }).should('be.visible')
      cy.contains('-ตัวอย่างการ์ดสินค้าจริงที่แสดงบนเว็บไซต์-').should('be.visible')
    })

    it('Section "ข้อมูลสินค้า" expandable', () => {
      cy.get('tbody tr:first-child a[href*="/products/update/"]').click()
      cy.contains('แก้ไข', { timeout: 15000 }).should('be.visible')
      cy.contains('ข้อมูลสินค้า').should('be.visible')
    })
  })

  // ===========================================================
  // 14) CRUD — Create / Edit / Delete (จริง)
  // ===========================================================
  describe('CRUD — สร้าง/แก้/ลบสินค้าจริง', () => {

    it('สร้างสินค้าด้วย required fields ครบ 11 (2 tabs) → สำเร็จ', () => {
      const data = buildProductDataLocal()
      openCreate()
      fillCreateRequired(data)
      clickSave()
      // save สำเร็จ → redirect ไป list
      cy.url({ timeout: 15000 }).should('match', /\/products\/?$/)
      // verify ใน list
      cy.get('input[placeholder="ค้นหา"]').clear().type(data.sku)
      cy.wait(2000)
      cy.contains('tbody tr', data.sku, { timeout: 10000 }).should('be.visible')
    })

    // จับ Bug A: กรอกแค่ tab "ข้อมูลทั่วไป" (ไม่ไป tab คลังสินค้า) → API 400 silent
    it('[Bug A] กรอกแค่ tab ข้อมูลทั่วไป (ไม่กรอก stock/price) → API 400 silent', () => {
      const data = buildProductDataLocal()
      openCreate()
      // กรอกแค่ tab แรก (7 fields) — ข้าม tab คลังสินค้าและราคา (4 fields)
      cy.contains('button', 'ข้อมูลทั่วไป').click()
      cy.get('input[name="sku"]').type(data.sku)
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
      cy.get('input[name="translations.1.name"]').type(data.enName)
      pickSelect('แบรนด์', data.brand)
      pickSelect('Category 1', data.cat1)
      pickSelect('Category 2', data.cat2)
      pickSelect('Category 3', data.cat3)
      clickSave()
      // ระบบไม่ redirect (silent fail) → ยังอยู่ /create
      cy.wait(3000)
      cy.url().should('include', '/products/create')
    })

    // จับ Bug ใหม่: webStock label มี * แต่ readonly
    it('[Bug] webStock มี label * (required) แต่ readonly', () => {
      openCreate()
      cy.contains('button', 'คลังสินค้าและราคา').click()
      cy.contains('label', 'จำนวนสินค้าในคลัง (iTech)').should('contain.text', '*')
      cy.get('input[name="webStock"]').should('have.attr', 'readonly')
    })

    it('แก้ไข highlight TH ของสินค้าที่มีอยู่ → save สำเร็จ + redirect ไป list', () => {
      cy.visit(LIST_URL)
      openFirstEdit()
      const newHighlight = `TEST EDIT ${rand()}`
      cy.get('textarea[name="translations.0.highlight"]').clear().type(newHighlight)
      cy.contains('button', 'บันทึก').filter(':not(:contains("ดู"))').click()
      cy.url({ timeout: 15000 }).should('match', /\/products\/?$/)
    })

    it('แก้ไข name TH ของสินค้าที่มีอยู่ → save สำเร็จ', () => {
      cy.visit(LIST_URL)
      openFirstEdit()
      cy.get('input[name="translations.0.name"]').then(($el) => {
        const original = $el.val()
        const newName = `${original} EDIT`
        cy.get('input[name="translations.0.name"]').clear().type(newName)
        cy.contains('button', 'บันทึก').filter(':not(:contains("ดู"))').click()
        cy.url({ timeout: 15000 }).should('match', /\/products\/?$/)
        // restore: เปิดแก้กลับ
        cy.visit(LIST_URL)
        openFirstEdit()
        cy.get('input[name="translations.0.name"]').clear().type(original)
        cy.contains('button', 'บันทึก').filter(':not(:contains("ดู"))').click()
      })
    })

    it('Toggle "ฉบับร่าง" ↔ active บน edit page + save', () => {
      cy.visit(LIST_URL)
      openFirstEdit()
      // จำสถานะ toggle ก่อน
      cy.get('#mode').then(($el) => {
        const beforeState = $el.attr('data-state')
        // กด toggle
        $el[0].click()
        cy.contains('button', 'บันทึก').filter(':not(:contains("ดู"))').click()
        cy.url({ timeout: 15000 }).should('match', /\/products\/?$/)
        // ตอนนี้ state เปลี่ยน — toggle กลับเพื่อ restore
        cy.visit(LIST_URL)
        openFirstEdit()
        cy.get('#mode').then(($el2) => {
          if ($el2.attr('data-state') !== beforeState) {
            $el2[0].click()
            cy.contains('button', 'บันทึก').filter(':not(:contains("ดู"))').click()
          }
        })
      })
    })

    it('Open menu บน edit page มี "ลบรายการ"', () => {
      cy.visit(LIST_URL)
      openFirstEdit()
      cy.get('button[aria-label="Open menu"]').click()
      cy.contains('[role="menuitem"]', 'ลบรายการ').should('be.visible')
      cy.get('body').type('{esc}')
    })

    // หมายเหตุ: ไม่ลบจริง — แค่เปิด dialog ลบ แล้วยกเลิก
    it('เปิด dialog ลบ → ยกเลิก → record ยังอยู่', () => {
      cy.visit(LIST_URL)
      openFirstEdit()
      cy.get('button[aria-label="Open menu"]').click()
      cy.contains('[role="menuitem"]', 'ลบรายการ').click()
      // คาดว่ามี confirm dialog
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible')
      cy.get('[role="dialog"]').contains('button', 'ยกเลิก').click()
      cy.get('[role="dialog"]').should('not.exist')
      // ยังอยู่หน้า edit
      cy.url().should('include', '/products/update/')
    })
  })

  // ===========================================================
  // 15) BUG VERIFICATION (test เพื่อจับ bug ที่รู้แล้ว)
  // ===========================================================
  describe('Bug verification', () => {
    it('Bug C: ตัวแรกใน Brand dropdown โชว์ "|"', () => {
      openCreate()
      cy.contains('button[data-slot="searchable-select-trigger"]', 'แบรนด์').click()
      // option แรกจะมี text เป็น "|" — bug placeholder/separator
      cy.get('[data-slot="popover-content"] span.truncate').first().invoke('text').then((t) => {
        expect(t.trim()).to.eq('|')
      })
      cy.get('body').type('{esc}')
    })
  })

  // ===========================================================
  // 16) BREADCRUMB / NAV
  // ===========================================================
  describe('Navigation', () => {
    it('breadcrumb แสดง "สินค้า"', () => {
      cy.get('nav[aria-label="breadcrumb"]').should('contain.text', 'สินค้า')
    })

    it('Sidebar มี "จัดการสินค้า" → "สินค้า"', () => {
      cy.contains('สินค้า').should('be.visible')
    })
  })
})
