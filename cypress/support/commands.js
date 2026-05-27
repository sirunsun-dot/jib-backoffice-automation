Cypress.Commands.add('loginJIB', (email, password) => {
  cy.visit('https://devstorex.jibc.codelabdev.co/auth/sign-in')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.contains('button', 'เข้าสู่ระบบ').click()
  // ตรวจสอบให้แน่ใจว่าเข้าหน้าแรกสำเร็จก่อนไปต่อ
  cy.url({ timeout: 15000 }).should('not.include', '/auth/sign-in')
})