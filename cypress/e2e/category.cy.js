const BASE = 'https://backoffice.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/product-manager/categories`

describe('จัดการหมวดหมู่สินค้า', () => {

  beforeEach(() => {
    cy.session('jib-admin', () => {
      cy.loginJIB('admin00@email.com', 'password123')
    })
    cy.visit(LIST_URL)
    cy.contains('p', 'หมวดหมู่สินค้า').should('be.visible')
  })

  // ---------- helpers ----------

  // สร้างหมวดหมู่ใหม่ (ไม่อัปโหลดรูป) แล้วคืน data ที่กรอกไป
  const seedCategory = (label = '') => {
    const n = Math.floor(10000 + Math.random() * 90000)
    const data = {
      refNo: `jibtest${n}${label}`,
      slug: `jib${n}${label}`,
      thaiName: `เทสหมวดหมู่ ${n}${label}`,
      thaiDesc: `รายละเอียดภาษาไทย ${n}`,
      enName: `test category ${n}${label}`,
      enDesc: `english description ${n}`,
    }
    cy.contains('button', 'เพิ่มหมวดหมู่สินค้า').click()
    cy.url().should('include', '/categories/create')

    cy.get('input[name="referenceNo"]').type(data.refNo)
    cy.get('input[name="slug"]').type(data.slug)
    cy.get('input[name="translations.0.name"]').type(data.thaiName)
    cy.get('textarea[name="translations.0.description"]').type(data.thaiDesc)
    cy.get('input[name="translations.1.name"]').type(data.enName)
    cy.get('textarea[name="translations.1.description"]').type(data.enDesc)

    cy.contains('button', 'บันทึก').click()
    cy.contains('สร้างหมวดหมู่สินค้าสำเร็จแล้ว', { timeout: 15000 }).should('be.visible')
    cy.url().should('match', /\/categories\/?$/, { timeout: 15000 })
    return cy.wrap(data, { log: false })
  }

  // ค้นหา record ในตาราง แล้วเปิดหน้า edit
  const openEditFor = (name) => {
    cy.get('input[placeholder="ค้นหา"]').clear().type(name)
    cy.contains('tbody tr', name, { timeout: 10000 })
      .find('a[href*="/categories/update/"]')
      .click()
    cy.url().should('include', '/categories/update/')
    cy.contains('ข้อมูลหมวดหมู่สินค้า').should('be.visible')
  }

  // ---------- tests ----------

  it('สร้างหมวดหมู่สินค้าใหม่ (ข้อมูลพื้นฐาน)', () => {
    seedCategory().then((data) => {
      cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
      cy.contains('tbody tr', data.thaiName).should('be.visible')
    })
  })

  it('สร้างหมวดหมู่สินค้าใหม่พร้อมอัปโหลดรูปภาพและเปิดใช้งาน', () => {
    const n = Math.floor(10000 + Math.random() * 90000)

    cy.contains('button', 'เพิ่มหมวดหมู่สินค้า').click()
    cy.url().should('include', '/categories/create')

    // toggle "ฉบับร่าง" -> เปิดใช้งาน
    cy.get('#mode').click({ force: true })

    // อัปโหลดรูป
    cy.get('input[accept="image/*"]').selectFile('cypress/fixtures/jib.png', { force: true })
    cy.get('img').should('be.visible')

    cy.get('input[name="referenceNo"]').type(`jibtest${n}img`)
    cy.get('input[name="slug"]').type(`jib${n}img`)
    cy.get('input[name="translations.0.name"]').type(`เทสรูป ${n}`)
    cy.get('textarea[name="translations.0.description"]').type('คำอธิบายภาษาไทย')
    cy.get('input[name="translations.1.name"]').type(`test image ${n}`)
    cy.get('textarea[name="translations.1.description"]').type('english description')

    cy.contains('button', 'บันทึก').click()
    cy.contains('สร้างหมวดหมู่สินค้าสำเร็จแล้ว', { timeout: 15000 }).should('be.visible')
  })

  it('แก้ไขชื่อหมวดหมู่และบันทึก', () => {
    seedCategory('-edit').then((data) => {
      openEditFor(data.thaiName)
      const newName = `${data.thaiName}-แก้แล้ว`
      cy.get('input[name="translations.0.name"]').clear().type(newName)
      cy.contains('button', 'บันทึก').click()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      cy.get('input[name="translations.0.name"]').should('have.value', newName)
    })
  })

  it('เปลี่ยนสถานะจากฉบับร่างเป็นเปิดใช้งาน', () => {
    seedCategory('-status').then((data) => {
      openEditFor(data.thaiName)
      // จาก seedCategory ค่าเริ่มคือฉบับร่าง — กดเพื่อเปิดใช้งาน
      cy.get('#mode').click({ force: true })
      cy.contains('กำลังเปิดใช้งาน').should('be.visible')
      cy.contains('button', 'บันทึก').click()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
    })
  })

  it('ยกเลิกการลบ — ข้อมูลยังคงอยู่', () => {
    seedCategory('-cancel-del').then((data) => {
      openEditFor(data.thaiName)
      cy.get('button[aria-label="Open menu"]').click()
      cy.contains('ลบหมวดหมู่').click()
      cy.contains('ยืนยันลบหมวดหมู่นี้ใช่หรือไม่').should('be.visible')
      cy.get('[role="dialog"]').contains('button', 'ยกเลิก').click()
      cy.url().should('include', '/categories/update/')
      cy.get('input[name="translations.0.name"]').should('have.value', data.thaiName)
    })
  })

  it('ลบหมวดหมู่และหายจากตาราง', () => {
    seedCategory('-del').then((data) => {
      openEditFor(data.thaiName)
      cy.get('button[aria-label="Open menu"]').click()
      cy.contains('ลบหมวดหมู่').click()
      cy.contains('ยืนยันลบหมวดหมู่นี้ใช่หรือไม่').should('be.visible')
      cy.get('[role="dialog"]').contains('button', 'ลบ').click()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      cy.url().should('match', /\/categories\/?$/, { timeout: 15000 })
      cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
      cy.contains('tbody tr', data.thaiName, { timeout: 8000 }).should('not.exist')
    })
  })

  it('ค้นหาหมวดหมู่ตามชื่อ', () => {
    seedCategory('-search').then((data) => {
      cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
      cy.contains('tbody tr', data.thaiName, { timeout: 10000 }).should('be.visible')
    })
  })

  it('กรองตามสถานะ "ปิดใช้งาน"', () => {
    cy.contains('button', 'ตัวกรอง').click()
    cy.get('[role="dialog"]').within(() => {
      cy.contains('ปิดใช้งาน').click()
      cy.contains('button', 'ยืนยัน').click()
    })
    cy.get('[role="dialog"]').should('not.exist')
    // ทุก row ที่แสดงต้องมีสถานะ "ปิดใช้งาน"
    cy.get('tbody tr', { timeout: 10000 }).should('have.length.at.least', 1)
    cy.get('tbody tr').each(($row) => {
      cy.wrap($row).should('contain.text', 'ปิดใช้งาน')
    })
  })

  it('ล้างตัวกรองทั้งหมด', () => {
    // เปิด filter + ติ๊ก "ปิดใช้งาน" + ยืนยัน
    cy.contains('button', 'ตัวกรอง').click()
    cy.get('[role="dialog"]').within(() => {
      cy.contains('ปิดใช้งาน').click()
      cy.contains('button', 'ยืนยัน').click()
    })
    // เปิด filter อีกครั้ง + กด "ล้างทั้งหมด" ที่ footer + ยืนยัน
    cy.contains('button', 'ตัวกรอง').click()
    cy.get('[role="dialog"]').within(() => {
      cy.get('button').contains('ล้างทั้งหมด').last().click()
      cy.contains('button', 'ยืนยัน').click()
    })
    cy.get('[role="dialog"]').should('not.exist')
  })

  it('เปลี่ยนจำนวนแถวต่อหน้า', () => {
    cy.contains('button', 'ตัวกรอง').should('be.visible')
    cy.get('tbody tr').its('length').should('be.lte', 10)
    // เปลี่ยน combobox จำนวนแถว -> 20 (options: 10, 20, 50, 100)
    cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').click()
    cy.contains('[role="option"]', '20').click()
    cy.get('tbody tr', { timeout: 10000 }).its('length').should('be.gte', 1)
  })
})
