describe('JIB Backoffice Login Test', () => {
  it('ควรจะเข้าสู่ระบบสำเร็จด้วย Credentials ที่ถูกต้อง', () => {
    // 1. ไปยังหน้าเว็บ (สมมติ URL)
    cy.visit('https://backoffice.jibc.codelabdev.co/') 

    // 2. กรอก Username และ Password
    cy.get('input[name="email"]').type('admin00@email.com')
    cy.get('input[name="password"]').type('password123')
    

    // 3. คลิกปุ่ม Login
    cy.contains('button', 'เข้าสู่ระบบ').click()

    // 4. ตรวจสอบว่า Login สำเร็จ (เช่น เช็คว่ามีคำว่า Dashboard หรือไม่)
    cy.contains('ร้านค้า').should('be.visible')
  })
})