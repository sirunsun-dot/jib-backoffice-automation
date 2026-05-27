const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST = `${BASE}/store/promotion-manager/promotions`
const n = () => Date.now()

const openCreateDiscount = () => {
  cy.visit(LIST)
  cy.contains('p', 'รายการโปรโมชันทั้งหมดในระบบ', { timeout: 20000 }).should('be.visible')
  cy.get('[data-slot="skeleton"]', { timeout: 20000 }).should('not.exist')
  cy.contains('button', 'เพิ่มโปรโมชัน').click()
  cy.get('[role="dialog"]').within(() => {
    cy.contains('button', 'Discount/ส่วนลด').click()
    cy.contains('button', 'ยืนยัน').click()
  })
  cy.url({ timeout: 15000 }).should('include', '/promotions/create')
}

describe('Explore promotion item wizard step 3', () => {
  before(() => {
    cy.session('jib-explore-promo', () => {
      cy.loginJIB('admin00@email.com', 'password123')
    })
  })

  it('complete wizard with product', () => {
    cy.viewport(1920, 1080)
    openCreateDiscount()
    cy.contains('label', 'ไม่มีวันหมดอายุ').click()
    cy.get('input[name="translations.0.name"]').type(`แคมเปญคู่มือ ${n()}`)
    cy.contains('button', 'เพิ่มรายการโปรโมชั่น').click()

    cy.get('input[name="translations.0.name"]').type(`รายการส่วนลด ${n()}`)
    cy.contains('button', 'ถัดไป').click()
    cy.wait(1500)

    cy.contains('button', /เลือกสินค้า/).click()
    cy.get('[role="dialog"]', { timeout: 15000 }).should('be.visible')
    cy.wait(2000)
    cy.screenshot('explore/product-picker', { capture: 'viewport', scale: false })

    cy.get('[role="dialog"]').within(() => {
      cy.get('tbody tr').first().find('button[role="checkbox"]').click({ force: true })
      cy.wait(500)
      cy.contains('button', /^ยืนยัน/).should('not.be.disabled').click()
    })
    cy.get('[role="dialog"]', { timeout: 15000 }).should('not.exist')
    cy.wait(1000)
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
    cy.screenshot('explore/step2-with-product', { capture: 'viewport', scale: false })

    cy.contains('button', 'ถัดไป').click()
    cy.wait(2000)
    cy.screenshot('explore/step3-review', { capture: 'viewport', scale: false })

    cy.contains('button', 'บันทึก').click({ force: true })
    cy.wait(3000)
    cy.screenshot('explore/step3-after-item-save', { capture: 'viewport', scale: false })

    cy.contains('button', 'บันทึก').first().click({ force: true })
    cy.wait(3000)
    cy.screenshot('explore/campaign-after-save', { capture: 'viewport', scale: false })
    cy.url().then((url) => cy.log('final url', url))
  })
})
