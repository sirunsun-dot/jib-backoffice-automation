/**
 * จับภาพหน้าจอ flow โปรโมชั่น สำหรับคู่มือผู้ใช้ (ครบ E2E สร้างแคมเปญ + รายการ)
 */
const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/promotion-manager/promotions`
const OUT = 'promotions-manual'

const shot = (name) => cy.screenshot(`${OUT}/${name}`, { capture: 'viewport', scale: false })
const n = () => Date.now()

const goList = () => {
  cy.visit(LIST_URL)
  cy.contains('p', 'รายการโปรโมชันทั้งหมดในระบบ', { timeout: 20000 }).should('be.visible')
  cy.get('[data-slot="skeleton"]', { timeout: 20000 }).should('not.exist')
  cy.wait(1000)
}

const openCreate = (campaignType = 'Discount/ส่วนลด') => {
  cy.contains('button', 'เพิ่มโปรโมชัน').click()
  cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
  cy.get('[role="dialog"]').within(() => {
    cy.contains('button', campaignType).click()
    cy.contains('button', 'ยืนยัน').should('not.be.disabled').click()
  })
  cy.url({ timeout: 15000 }).should('include', '/promotions/create')
  cy.contains('p', 'เพิ่มแคมเปญโปรโมชั่น', { timeout: 10000 }).should('be.visible')
}

const pickFirstProductInDialog = () => {
  cy.get('[role="dialog"]', { timeout: 15000 }).should('be.visible')
  cy.wait(1500)
  cy.get('[role="dialog"]').within(() => {
    cy.get('tbody tr').first().find('button[role="checkbox"]').click({ force: true })
    cy.wait(500)
    cy.contains('button', /^ยืนยัน/).should('not.be.disabled').click()
  })
  cy.get('[role="dialog"]', { timeout: 15000 }).should('not.exist')
  cy.wait(800)
}

const fillDiscountOnStep2 = () => {
  cy.contains('อนุญาตแก้ไขจากตาราง').parent().find('button[role="switch"]').click({ force: true })
  cy.wait(500)
  cy.get('[class*="overflow-x"], .overflow-x-auto').first().scrollTo('right', { ensureScrollable: false })
  cy.wait(400)
  cy.get('tbody tr').first().find('input:not([disabled])').then(($inputs) => {
    const target = [...$inputs].find((el) => {
      const ph = el.getAttribute('placeholder') || ''
      return /ส่วนลด|%|บาท|ราคาโปร/i.test(ph)
    })
    const el = target || $inputs[$inputs.length - 1]
    cy.wrap(el).clear({ force: true }).type('100', { force: true })
  })
  cy.wait(800)
}

describe('Screenshots: โปรโมชั่น (คู่มือ)', () => {
  before(() => {
    cy.session('jib-admin-screenshots-promo', () => {
      cy.loginJIB('admin00@email.com', 'password123')
    })
  })

  beforeEach(() => {
    cy.viewport(1920, 1080)
  })

  it('01–18 จับภาพ flow หลักและสร้างจนจบ', () => {
    const campaignName = `คู่มือโปรโมชั่น ${n()}`
    const itemName = `รายการส่วนลด ${n()}`

    goList()
    shot('01-list')

    cy.get('input[placeholder="ค้นหาชื่อโปรโมชัน"]').clear().type('สงกรานต์')
    cy.wait(1500)
    shot('02-search')
    cy.get('input[placeholder="ค้นหาชื่อโปรโมชัน"]').clear()

    cy.contains('button', 'ตัวกรอง').click({ force: true })
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
    cy.wait(500)
    shot('03-filter-dialog')
    cy.get('body').type('{esc}')
    cy.wait(500)

    cy.contains('button', 'เพิ่มโปรโมชัน').click()
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
    cy.contains('h2', 'เลือกรูปแบบแคมเปญสินค้า').should('be.visible')
    shot('04-campaign-type-dialog')

    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', 'Discount/ส่วนลด').click()
    })
    cy.wait(300)
    shot('05-campaign-type-selected')

    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', 'ยืนยัน').click()
    })
    cy.url({ timeout: 15000 }).should('include', '/promotions/create')
    cy.wait(800)
    shot('06-create-overview')

    cy.get('input[name="translations.0.name"]').type(campaignName)
    cy.get('textarea[name="translations.0.description"]').type('รายละเอียดโปรโมชั่นสำหรับคู่มือ')
    cy.wait(500)
    shot('07-create-basic-filled')

    cy.contains('label', 'ไม่มีวันหมดอายุ').click()
    cy.wait(300)
    shot('08-create-duration')

    cy.contains('ยังไม่มีรายการโปรโมชัน').should('be.visible')
    shot('09-create-items-empty')

    cy.contains('button', 'เพิ่มรายการโปรโมชั่น').click()
    cy.url().should('include', '/items/create')
    cy.contains('p', 'เพิ่มรายการโปรโมชัน', { timeout: 10000 }).should('be.visible')
    cy.wait(800)
    shot('10-item-wizard-step1')

    cy.get('input[name="translations.0.name"]').type(itemName)
    cy.get('textarea[name="translations.0.description"]').type('รายละเอียดรายการโปรโมชั่นในคู่มือ')
    cy.wait(400)
    shot('11-item-wizard-step1-filled')

    cy.contains('button', 'ถัดไป').click()
    cy.contains(/เลือกสินค้า|ขั้นตอน.*2/, { timeout: 10000 }).should('exist')
    cy.wait(1000)
    shot('12-item-wizard-step2-empty')

    cy.contains('button', 'ถัดไป').click()
    cy.wait(800)
    cy.contains(/กรุณาเลือกสินค้าอย่างน้อย 1 รายการ/, { timeout: 5000 }).should('be.visible')
    shot('13-item-wizard-step2-validation')

    cy.contains('button', /เลือกสินค้า/).click()
    cy.wait(500)
    shot('14-product-picker-dialog')
    pickFirstProductInDialog()
    shot('15-item-wizard-step2-with-products')
    fillDiscountOnStep2()
    shot('15b-item-wizard-step2-discount-filled')

    cy.contains('button', 'ถัดไป').click()
    cy.wait(1500)
    shot('16-item-wizard-step3')

    cy.contains('button', 'บันทึก').click({ force: true })
    cy.url({ timeout: 20000 }).should('include', '/promotions/create')
    cy.wait(1000)
    cy.contains('tbody tr', itemName, { timeout: 15000 }).should('be.visible')
    shot('17-create-with-item-in-table')

    cy.contains('button', 'บันทึก').first().click({ force: true })
    cy.wait(3000)
    shot('17b-create-after-campaign-save')
    cy.visit(LIST_URL)
    cy.contains('p', 'รายการโปรโมชันทั้งหมดในระบบ', { timeout: 20000 }).should('be.visible')
    cy.get('[data-slot="skeleton"]', { timeout: 20000 }).should('not.exist')
    cy.wait(1500)
    cy.get('input[placeholder="ค้นหาชื่อโปรโมชัน"]').clear().type(campaignName)
    cy.wait(2000)
    cy.contains('tbody tr', campaignName, { timeout: 20000 }).should('be.visible')
    shot('18-list-after-save')
  })
})
