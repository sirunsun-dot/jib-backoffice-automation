/**
 * จับภาพหน้าจอ flow ของแถม สำหรับคู่มือผู้ใช้ (ครบ E2E)
 */
const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/promotion-manager/free-gifts`
const OUT = 'free-gifts-manual'

const shot = (name) => cy.screenshot(`${OUT}/${name}`, { capture: 'viewport', scale: false })
const n = () => Date.now()

const goList = () => {
  cy.visit(LIST_URL)
  cy.contains('p', 'ของแถม', { timeout: 20000 }).should('be.visible')
  cy.get('[data-slot="skeleton"]', { timeout: 20000 }).should('not.exist')
  cy.wait(1000)
}

const openCreate = () => {
  cy.contains('button', 'เพิ่มของแถม').click()
  cy.url({ timeout: 15000 }).should('include', '/free-gifts/create')
  cy.contains('ข้อมูลทั่วไป', { timeout: 10000 }).should('be.visible')
}

const fillMinQuantity = (value = '1') => {
  cy.contains(/จำนวนขั้นต่ำ/)
    .closest('div[class*="grid"], div[class*="flex"], form, section')
    .find('input')
    .filter(':visible')
    .first()
    .clear({ force: true })
    .type(String(value), { force: true })
}

const pickFirstGiftProduct = () => {
  cy.contains('button', /เลือกสินค้า/).click()
  cy.get('[role="dialog"]', { timeout: 15000 }).should('be.visible')
  cy.wait(1500)
  cy.get('[role="dialog"]').within(() => {
    cy.get('tbody tr').first().find('button[role="checkbox"]').click({ force: true })
    cy.wait(500)
    cy.contains('button', /^เพิ่ม/).should('not.be.disabled').click()
  })
  cy.get('[role="dialog"]', { timeout: 15000 }).should('not.exist')
  cy.wait(800)
}

describe('Screenshots: ของแถม (คู่มือ)', () => {
  before(() => {
    cy.session('jib-admin-screenshots-fg', () => {
      cy.loginJIB('admin00@email.com', 'password123')
    })
  })

  beforeEach(() => {
    cy.viewport(1920, 1080)
  })

  it('01–15 จับภาพ flow สร้างของแถมจนจบ', () => {
    const campaignName = `คู่มือของแถม ${n()}`

    goList()
    shot('01-list')

    cy.get('input[placeholder="ค้นหาชื่อของแถม"]').clear().type('คู่มือ')
    cy.wait(1500)
    shot('02-search')
    cy.get('input[placeholder="ค้นหาชื่อของแถม"]').clear()

    cy.contains('button', 'ตัวกรอง').click({ force: true })
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
    cy.wait(500)
    shot('03-filter-dialog')
    cy.get('body').type('{esc}')
    cy.wait(500)

    openCreate()
    cy.wait(800)
    shot('04-create-overview')

    cy.get('input[name="translations.0.name"]').type(campaignName)
    cy.get('textarea[name="translations.0.description"]').type('รายละเอียดแคมเปญของแถมสำหรับคู่มือ')
    cy.wait(500)
    shot('05-create-basic-filled')

    cy.contains('label', 'ไม่มีวันหมดอายุ').click()
    cy.wait(300)
    shot('06-create-duration')

    cy.contains('ยังไม่มีรายการของแถม').should('be.visible')
    shot('07-create-items-empty')

    cy.contains('button', 'เพิ่มรายการของแถม').click()
    cy.url().should('include', '/items/create')
    cy.wait(1000)
    shot('08-item-form-overview')

    fillMinQuantity('1')
    cy.wait(400)
    shot('09-item-min-quantity')

    cy.contains('button', 'บันทึก').click({ force: true })
    cy.wait(1000)
    cy.contains(/กรุณาเพิ่มของแถมอย่างน้อย 1 รายการ/).should('be.visible')
    shot('10-item-validation-no-gift')

    cy.contains('button', /เลือกสินค้า/).click()
    cy.get('[role="dialog"]', { timeout: 15000 }).should('be.visible')
    cy.wait(1500)
    shot('11-product-picker-dialog')
    cy.get('body').type('{esc}')
    cy.get('[role="dialog"]', { timeout: 10000 }).should('not.exist')
    cy.wait(500)

    pickFirstGiftProduct()
    shot('12-item-with-gift-product')

    cy.contains('button', 'บันทึก').click({ force: true })
    cy.url({ timeout: 20000 }).should('include', '/free-gifts/create')
    cy.wait(1500)
    cy.contains('tbody tr', /ซื้อครบ|คู่มือ|1 ชิ้น/, { timeout: 15000 }).should('be.visible')
    shot('13-create-with-item-in-table')

    cy.contains('button', 'บันทึก').first().click({ force: true })
    cy.wait(3000)
    cy.visit(LIST_URL)
    cy.contains('p', 'ของแถม', { timeout: 20000 }).should('be.visible')
    cy.get('[data-slot="skeleton"]', { timeout: 20000 }).should('not.exist')
    cy.get('input[placeholder="ค้นหาชื่อของแถม"]').clear().type(campaignName)
    cy.wait(2000)
    cy.contains('tbody tr', campaignName, { timeout: 20000 }).should('be.visible')
    shot('14-list-after-save')
  })
})
