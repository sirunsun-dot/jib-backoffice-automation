/**
 * จับภาพหน้าจอ flow เทมเพลตคุณสมบัติ สำหรับคู่มือผู้ใช้
 * รัน: npx cypress run --spec cypress/e2e/template-attributes-screenshots.cy.js
 */
const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/product-manager/template-attributes`
const OUT = 'template-attributes-manual'

const shot = (name) => cy.screenshot(`${OUT}/${name}`, { capture: 'viewport', scale: false })

const goList = () => {
  cy.visit(LIST_URL)
  cy.contains('p', 'เทมเพลตคุณสมบัติ', { timeout: 20000 }).should('be.visible')
  cy.wait(1000)
}

describe('Screenshots: เทมเพลตคุณสมบัติ (คู่มือ)', () => {
  before(() => {
    cy.session('jib-admin-screenshots', () => {
      cy.loginJIB('sirun.sun@codelabdev.co', 'test123')
    })
  })

  beforeEach(() => {
    cy.viewport(1920, 1080)
  })

  it('01–12 จับภาพ flow หลัก', () => {
    goList()
    shot('01-list')

    cy.get('input[placeholder="ค้นหา"]').clear().type('Computer')
    cy.wait(1500)
    shot('02-search')
    cy.get('input[placeholder="ค้นหา"]').clear()
    cy.wait(800)

    cy.contains('button', 'ตัวกรอง').click({ force: true })
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
    cy.wait(500)
    shot('03-filter-dialog')
    cy.get('body').type('{esc}')
    cy.wait(500)

    // ดูตัวอย่าง — คลิกปุ่มที่ไม่ใช่ลิงก์แก้ไข
    cy.get('tbody tr').first().find('button').then(($btns) => {
      const previewBtn = [...$btns].find((b) => !b.closest('a'))
      if (previewBtn) cy.wrap(previewBtn).click({ force: true })
    })
    cy.get('body', { timeout: 8000 }).then(($b) => {
      if ($b.text().includes('ตัวอย่างการแสดงผล')) {
        shot('04-preview-dialog')
        cy.get('body').type('{esc}')
        cy.wait(500)
      }
    })

    goList()
    cy.contains('button', 'เพิ่มเทมเพลต').click()
    cy.url().should('include', '/create')
    cy.contains('ข้อมูลพื้นฐาน', { timeout: 15000 }).should('be.visible')
    cy.wait(800)
    shot('05-create-basic')

    cy.get('button[data-slot="select-trigger"]').eq(0).click()
    cy.get('[role="option"]', { timeout: 10000 }).first().click()
    cy.get('button[data-slot="select-trigger"]').eq(1).should('not.be.disabled')
    cy.get('button[data-slot="select-trigger"]').eq(1).click()
    cy.get('[role="option"]').first().click()
    cy.get('input[name="name"]').type('คู่มือ Screenshot Demo')
    cy.wait(500)
    shot('06-create-category-filled')

    cy.contains('button', /^การแสดงผล$/).click()
    cy.wait(800)
    shot('07-display-empty')

    cy.contains('button', 'เพิ่มคุณสมบัติ').click()
    cy.get('input[name="displayTopics.0.nameTh"]').type('สเปคหลัก')
    cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click()
    cy.get('input[name="displayTopics.0.items.0.nameTh"]').type('สี')
    cy.wait(500)
    shot('08-display-with-items')

    cy.contains('button', /^Mapping$/).click()
    cy.wait(800)
    shot('09-mapping-tab')

    cy.contains('button', 'เพิ่มคุณสมบัติ').click()
    cy.get('input[name="templateMapping.0.name"]').type('Filter Map')
    cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click()
    cy.contains('button[data-slot="select-trigger"]', 'เลือกกลุ่มตัวเลือก').click()
    cy.get('[role="option"]').first().click()
    cy.wait(500)
    shot('10-mapping-with-option')

    cy.contains('button', 'ข้อมูลพื้นฐาน').click()
    cy.wait(500)
    shot('11-create-header-save')

    goList()
    cy.get('tbody tr').first().find('a[href*="/template-attributes/update/"]').click({ force: true })
    cy.url().should('include', '/update/')
    cy.contains('ข้อมูลพื้นฐาน', { timeout: 15000 }).should('be.visible')
    cy.wait(1000)
    shot('12-edit-page')
  })
})
