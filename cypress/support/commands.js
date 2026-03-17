Cypress.Commands.add('loginJIB', (email, password) => {
  cy.visit('https://backoffice.jibc.codelabdev.co/')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.contains('button', 'เข้าสู่ระบบ').click()
  // ตรวจสอบให้แน่ใจว่าเข้าหน้าแรกสำเร็จก่อนไปต่อ
  cy.contains('ร้านค้า').should('be.visible')
})