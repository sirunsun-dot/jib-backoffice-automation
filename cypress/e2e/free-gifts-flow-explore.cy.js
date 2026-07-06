const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST = `${BASE}/store/promotion-manager/free-gifts`
const n = () => Date.now()

describe('Explore free-gifts create flow', () => {
  before(() => {
    cy.session('jib-explore-fg', () => {
      cy.loginJIB('sirun.sun@codelabdev.co', 'test123')
    })
  })

  it('complete create with gift item', () => {
    cy.viewport(1920, 1080)
    cy.visit(LIST)
    cy.contains('p', 'ของแถม', { timeout: 20000 }).should('be.visible')
    cy.get('[data-slot="skeleton"]', { timeout: 20000 }).should('not.exist')

    cy.contains('button', 'เพิ่มของแถม').click()
    cy.url({ timeout: 15000 }).should('include', '/free-gifts/create')

    const campaignName = `คู่มือของแถม ${n()}`
    cy.get('input[name="translations.0.name"]').type(campaignName)
    cy.contains('label', 'ไม่มีวันหมดอายุ').click()

    cy.contains('button', 'เพิ่มรายการของแถม').click()
    cy.url({ timeout: 15000 }).should('include', '/items/create')
    cy.wait(1500)
    cy.screenshot('explore/item-form', { capture: 'viewport', scale: false })

    cy.contains(/จำนวนขั้นต่ำ/).closest('div[class*="grid"], div[class*="flex"], form, section')
      .find('input')
      .filter(':visible')
      .first()
      .clear({ force: true })
      .type('1', { force: true })

    cy.contains('button', /เลือกสินค้า/).click()
    cy.get('[role="dialog"]', { timeout: 15000 }).should('be.visible')
    cy.wait(1500)
    cy.screenshot('explore/product-picker', { capture: 'viewport', scale: false })

    cy.get('[role="dialog"]').within(() => {
      cy.get('tbody tr').first().find('button[role="checkbox"]').click({ force: true })
      cy.wait(500)
      cy.contains('button', /^เพิ่ม/).should('not.be.disabled').click()
    })
    cy.get('[role="dialog"]', { timeout: 15000 }).should('not.exist')
    cy.wait(1000)
    cy.screenshot('explore/item-with-gift', { capture: 'viewport', scale: false })

    cy.contains('button', 'บันทึก').click({ force: true })
    cy.url({ timeout: 20000 }).should('include', '/free-gifts/create')
    cy.wait(2000)
    cy.screenshot('explore/parent-with-item', { capture: 'viewport', scale: false })

    cy.contains('button', 'บันทึก').first().click({ force: true })
    cy.wait(3000)
    cy.screenshot('explore/after-campaign-save', { capture: 'viewport', scale: false })
    cy.url().then((url) => cy.log('final', url))
  })
})
