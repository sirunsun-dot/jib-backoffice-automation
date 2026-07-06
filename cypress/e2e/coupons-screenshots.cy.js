/**
 * จับภาพหน้าจอ flow คูปอง (Coupons) สำหรับคู่มือผู้ใช้ (ครบ E2E)
 */
const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/promotion-manager/coupons`
const OUT = 'coupons-manual'

const shot = (name) => cy.screenshot(`${OUT}/${name}`, { capture: 'viewport', scale: false })
const n = () => Date.now()

const goList = () => {
  cy.visit(LIST_URL)
  cy.contains('p', 'คูปอง', { timeout: 20000 }).should('be.visible')
  cy.get('[data-slot="skeleton"]', { timeout: 20000 }).should('not.exist')
  cy.wait(1000)
}

const openCreate = () => {
  cy.contains('button', 'เพิ่มคูปอง').click()
  cy.url({ timeout: 15000 }).should('include', '/coupons/create')
  cy.contains('p', 'เพิ่มแคมเปญคูปอง', { timeout: 10000 }).should('be.visible')
}

const dialog = () => cy.get('[role="dialog"][data-state="open"]')

describe('Screenshots: คูปอง (คู่มือ)', () => {
  before(() => {
    cy.session('jib-admin-screenshots-coupons', () => {
      cy.loginJIB('sirun.sun@codelabdev.co', 'test123')
    })
  })

  beforeEach(() => {
    cy.viewport(1920, 1080)
  })

  it('01–14 จับภาพ flow สร้างคูปองจนจบ', () => {
    const campaignName = `คู่มือคูปอง ${n()}`
    const itemCode = `MANUAL${Math.floor(10000 + Math.random() * 90000)}`

    // ---- หน้ารายการ ----
    goList()
    shot('01-list')

    cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').clear().type('คู่มือ')
    cy.wait(1500)
    shot('02-search')
    cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').clear()

    cy.contains('button', 'ตัวกรอง').click({ force: true })
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
    cy.wait(500)
    shot('03-filter-dialog')
    cy.get('body').type('{esc}')
    cy.wait(500)

    // ---- หน้าสร้างแคมเปญ ----
    openCreate()
    cy.wait(800)
    shot('04-create-overview')

    cy.get('input[name="translations.0.name"]').type(campaignName)
    cy.wait(400)
    shot('05-create-basic-filled')

    cy.contains('label', 'ไม่มีวันหมดอายุ').click()
    cy.wait(300)
    shot('06-create-duration')

    cy.contains('ยังไม่มีรายการคูปอง').should('be.visible')
    shot('07-create-items-empty')

    // ---- Dialog เพิ่มรายการคูปอง ----
    cy.contains('button', 'เพิ่มรายการคูปอง').click()
    dialog().should('be.visible')
    cy.wait(800)
    shot('08-item-dialog-overview')

    // validation ฟอร์มเปล่า
    dialog().within(() => {
      cy.contains('button', 'ยืนยัน').click()
    })
    cy.wait(600)
    cy.contains(/กรุณากรอกรหัสคูปอง/).should('be.visible')
    shot('09-item-validation')

    // กรอกข้อมูลรายการคูปอง
    dialog().within(() => {
      cy.get('input[name="translations.0.name"]').clear().type('รายการคูปองคู่มือ')
      cy.get('input[name="discountValue"]').clear().type('10')
    })
    cy.wait(300)
    shot('10-item-filled')

    // สร้างรหัสอัตโนมัติ → โชว์ 3 ฟิลด์
    dialog().within(() => {
      cy.contains('label', 'สร้างรหัสอัตโนมัติ').click()
      cy.contains('คำนำหน้ารหัส').should('exist')
    })
    cy.wait(300)
    shot('11-item-auto-code')

    // กลับเป็นรหัสเดียว แล้วกรอกรหัส
    dialog().within(() => {
      cy.contains('label', 'รหัสเดียว').click()
      cy.get('input[name="code"]').clear().type(itemCode)
    })

    // เลือกเฉพาะสินค้าที่ต้องการ → product scope
    dialog().within(() => {
      cy.contains('label', 'เลือกเฉพาะสินค้าที่ต้องการ').click()
    })
    cy.wait(500)
    shot('12-item-product-scope')

    // กลับเป็นใช้กับสินค้าทั้งหมด
    dialog().within(() => {
      cy.contains('label', 'ใช้กับสินค้าทั้งหมด').click()
    })

    // ยืนยัน → รายการเข้าตาราง parent
    dialog().within(() => {
      cy.contains('button', 'ยืนยัน').click()
    })
    dialog().should('not.exist')
    cy.contains('tbody tr', itemCode, { timeout: 10000 }).should('be.visible')
    cy.wait(500)
    shot('13-item-in-table')

    // ---- บันทึกแคมเปญ + verify ใน list ----
    cy.contains('button', 'บันทึก').click()
    cy.url({ timeout: 20000 }).should('match', /\/coupons\/?$/)
    cy.contains('p', 'คูปอง', { timeout: 20000 }).should('be.visible')
    cy.get('[data-slot="skeleton"]', { timeout: 20000 }).should('not.exist')
    cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').clear().type(campaignName)
    cy.wait(2000)
    cy.contains('tbody tr', campaignName, { timeout: 20000 }).should('be.visible')
    shot('14-list-after-save')
  })
})
