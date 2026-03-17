describe('จัดการหมวดหมู่สินค้า', () => {
  
  beforeEach(() => {
    // แนะนำ: ถ้าหน้า Login โหลดช้า ให้ใส่ Assertion รอใน Custom Command ไว้ด้วย
    cy.loginJIB('admin00@email.com', 'password123')
  })

  it('ควรจะสร้างหมวดหมู่สินค้าใหม่พร้อมรูปภาพได้สำเร็จ', () => {

    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    const refNo = `jibtest${randomNumber}`;
    const slug = `jib${randomNumber}`;

    // 1. นำทางไปหน้าหมวดหมู่
    cy.get('[data-slot="sidebar"]')
      .contains('หมวดหมู่สินค้า')
      .click()

    cy.url().should('include', '/product-categories')
    cy.get('p').should('contain', 'หมวดหมู่สินค้า')

    // 2. เริ่มสร้างหมวดหมู่
    cy.contains('button', 'เพิ่มหมวดหมู่สินค้า').click()

    cy.get('#mode').click({ force: true })
    // 3. อัปโหลดรูปภาพ (จัดการไฟล์ก่อนเพื่อลดโอกาสพัง)
    const fileName = 'jib.png'
    cy.get('input[accept="image/*"]')
      .selectFile(`cypress/fixtures/${fileName}`, { force: true })
    
    // เช็คว่ารูปภาพถูกโหลดขึ้นมาจริงๆ (อาจใช้ตัวเลือกที่เจาะจงขึ้นถ้ามีหลายรูป)
    cy.get('img').should('be.visible')

    // 4. กรอกข้อมูลทั่วไป
    cy.get('input[name="referenceNo"]').type(refNo +'jib');
    cy.get('input[name="slug"]').type(slug+'jib');

    // 5. กรอกข้อมูลภาษาไทย (Index 0)
    // การใช้ .within() จะช่วยให้ Code อ่านง่ายขึ้นว่าเรากำลังกรอกชุดข้อมูลไหน
    cy.get('input[name="translations.0.name"]').type('เทสหมวดหมู่ภาษาไทย')
    cy.get('textarea[name="translations.0.description"]').type('เทสรายละเอียดภาษาไทย')

    // 6. กรอกข้อมูลภาษาอังกฤษ (Index 1)
    cy.get('input[name="translations.1.name"]').type('test category')
    cy.get('textarea[name="translations.1.description"]').type('test description category')

    cy.contains('button', 'บันทึก').click()
    // 8. Assertion ปิดท้าย (สำคัญมาก!)
    // ควรตรวจสอบว่ามี Success Toast หรือกลับไปหน้าลิสต์แล้วเจอชื่อที่เราเพิ่งสร้าง
    cy.contains('สร้างหมวดหมู่สินค้าสำเร็จแล้ว', { timeout: 10000 }).should('be.visible')
    // หรือ
    // cy.contains('เทสหมวดหมู่ภาษาไทย').should('be.visible')
  })
})