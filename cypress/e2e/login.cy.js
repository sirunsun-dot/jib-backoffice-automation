describe('JIB Backoffice Login Test', () => {
  it('ควรจะเข้าสู่ระบบสำเร็จด้วย Credentials ที่ถูกต้อง', () => {
    cy.visit('https://devstorex.jibc.codelabdev.co/auth/sign-in')

    cy.get('input[name="email"]').type('sirun.sun@codelabdev.co')
    cy.get('input[name="password"]').type('test123')

    cy.contains('button', 'เข้าสู่ระบบ').click()

    cy.url({ timeout: 15000 }).should('not.include', '/auth/sign-in')
  })
})