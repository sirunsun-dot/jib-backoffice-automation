/**
 * E2E Cypress — สร้างสินค้าจนจบ (ตาม docs/BUSINESS_FLOWS.md)
 * รัน: npm run test:products:e2e
 */
const {
  LIST_URL,
  buildProductData,
  createProductE2E,
  openProductCreate,
  fillProductCreateForm,
  clickProductSave,
  getFrontstoreLinkFromList,
  verifyProductOnFrontstore,
} = require('../support/product-helpers')

describe('สินค้า — E2E สร้างจนจบ (Cypress)', () => {
  beforeEach(() => {
    cy.session('jib-admin', () => {
      cy.loginJIB('sirun.sun@codelabdev.co', 'test123')
    })
    cy.visit(LIST_URL, {
      onBeforeLoad(win) {
        win.addEventListener('beforeunload', (e) => e.stopImmediatePropagation())
      },
    })
    cy.contains('p', 'สินค้า', { timeout: 15000 }).should('be.visible')
  })

  it('สร้างสินค้าครบ flow → redirect list → พบ SKU', () => {
    const data = buildProductData()
    createProductE2E(data)

    cy.get('input[placeholder="ค้นหา"]').clear().type(data.sku)
    cy.wait(2000)
    cy.contains('tbody tr', data.sku, { timeout: 15000 }).should('be.visible')
    cy.contains('tbody tr', data.thaiName).should('be.visible')
  })

  it('สร้างครบ → กดชื่อสินค้า → ตรวจข้อมูลบนหน้า Frontstore ตรงทั้งหมด', () => {
    const data = buildProductData()
    createProductE2E(data)

    // ชื่อสินค้าใน list เป็นลิงก์ไป Frontstore (href มี SKU)
    getFrontstoreLinkFromList(data.sku)

    // เปิดหน้า Frontstore แล้วตรวจ ชื่อ/แบรนด์/ราคา/ไฮไลท์/คุณสมบัติ/รูป
    verifyProductOnFrontstore(data)
  })

  it('สร้าง → แก้ชื่อ → บันทึก → พบชื่อใหม่', () => {
    const data = buildProductData()
    const edited = `${data.thaiName} (แก้ไข)`

    createProductE2E(data)

    cy.get('input[placeholder="ค้นหา"]').clear().type(data.sku)
    cy.wait(2000)
    cy.contains('tbody tr', data.sku).find('a[href*="/products/update/"]').click()
    cy.contains('แก้ไข', { timeout: 15000 }).should('be.visible')

    cy.get('input[name="translations.0.name"]').clear().type(edited)
    clickProductSave()
    cy.url({ timeout: 30000 }).should('match', /\/products\/?$/)

    cy.get('input[placeholder="ค้นหา"]').clear().type(data.sku)
    cy.wait(2000)
    cy.contains('tbody tr', edited, { timeout: 15000 }).should('be.visible')
  })

  it('สร้าง → เปิด dialog ลบ → ยกเลิก → ยังพบใน list', () => {
    const data = buildProductData()
    createProductE2E(data)

    cy.get('input[placeholder="ค้นหา"]').clear().type(data.sku)
    cy.wait(2000)
    cy.contains('tbody tr', data.sku).within(() => {
      cy.get('button[aria-label="Open menu"]').click()
    })
    cy.get('[role="menuitem"]').contains(/ลบ/).click()
    cy.get('[role="dialog"], [role="alertdialog"]', { timeout: 10000 }).should('be.visible')
    cy.get('[role="dialog"], [role="alertdialog"]').contains('button', 'ยกเลิก').click()
    cy.wait(1000)

    cy.get('input[placeholder="ค้นหา"]').clear().type(data.sku)
    cy.wait(2000)
    cy.contains('tbody tr', data.sku, { timeout: 10000 }).should('be.visible')
  })

  it('tab คลังสินค้าและราคา → เปิด toggle แสดงบนเว็บ + เปิดขาย', () => {
    const data = buildProductData()
    openProductCreate()
    fillProductCreateForm(data)

    cy.contains('button', 'คลังสินค้าและราคา').click()
    cy.get('button[role="switch"]').then(($switches) => {
      const display = $switches.filter((_, el) =>
        /การแสดงผลบนเว็บไซต์/.test(el.closest('div')?.textContent || '')
      )
      const sale = $switches.filter((_, el) =>
        /การเปิดขาย/.test(el.closest('div')?.textContent || '')
      )
      expect(display.attr('data-state')).to.eq('checked')
      expect(sale.attr('data-state')).to.eq('checked')
    })
  })

  it('validation ครั้งแรกแล้วกดบันทึกซ้ำผ่านได้ (กรอกแค่ชื่อ+SKU)', () => {
    const data = buildProductData()
    openProductCreate()
    cy.get('input[name="sku"]').type(data.sku)
    cy.get('input[name="translations.0.name"]').type(data.thaiName)
    clickProductSave()
    cy.contains('กรุณา', { timeout: 5000 }).should('be.visible')
    cy.url().should('include', '/products/create')

    // กรอกครบแล้วบันทึกซ้ำ
    fillProductCreateForm({ ...data, sku: data.sku, thaiName: data.thaiName })
    clickProductSave()
    cy.url({ timeout: 30000 }).should('match', /\/products\/?$/)
  })
})
