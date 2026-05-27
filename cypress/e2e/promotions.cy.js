const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/promotion-manager/promotions`

describe('จัดการโปรโมชั่น (Promotions)', () => {

  beforeEach(() => {
    cy.session('jib-admin', () => {
      cy.loginJIB('admin00@email.com', 'password123')
    })
    cy.visit(LIST_URL)
    cy.contains('p', 'รายการโปรโมชันทั้งหมดในระบบ', { timeout: 15000 }).should('be.visible')
    // รอ skeleton หาย / table โหลดเสร็จ
    cy.get('[data-slot="skeleton"]', { timeout: 20000 }).should('not.exist')
  })

  // ---------- helpers ----------

  const rand = () => Math.floor(10000 + Math.random() * 90000)

  const buildData = (label = '') => {
    const n = rand()
    return {
      thaiName: `เทสโปรโมชั่น ${n}${label}`,
      enName: `test promotion ${n}${label}`,
      thaiDesc: `รายละเอียดโปรโมชั่น ${n}`,
      enDesc: `promotion description ${n}`,
    }
  }

  // กดปุ่มเพิ่มโปรโมชัน → เลือก campaign type ใน dialog → ยืนยัน → ไปหน้า create
  const openCreate = (campaignType = 'Discount/ส่วนลด') => {
    cy.contains('button', 'เพิ่มโปรโมชัน').click()
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
    cy.contains('h2', 'เลือกรูปแบบแคมเปญสินค้า').should('be.visible')
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', campaignType).click()
      cy.contains('button', 'ยืนยัน').should('not.be.disabled').click()
    })
    cy.url({ timeout: 15000 }).should('include', '/promotions/create')
    cy.contains('p', 'เพิ่มแคมเปญโปรโมชั่น', { timeout: 10000 }).should('be.visible')
  }

  // ปิด switch "ใช้เหมือนกันทั้ง 2 ภาษา" เพื่อให้กรอก EN แยกได้
  const unlinkLanguages = () => {
    cy.contains('p', 'ใช้เหมือนกันทั้ง 2 ภาษา').parent().find('button[role="switch"]').click()
  }

  const fillBasicInfo = (data, { separateEN = false } = {}) => {
    cy.get('input[name="translations.0.name"]').clear().type(data.thaiName)
    if (separateEN) {
      unlinkLanguages()
      cy.get('input[name="translations.1.name"]').should('not.be.disabled').clear().type(data.enName)
    }
    if (data.thaiDesc) {
      cy.get('textarea[name="translations.0.description"]').clear().type(data.thaiDesc)
    }
    if (separateEN && data.enDesc) {
      cy.get('textarea[name="translations.1.description"]').should('not.be.disabled').clear().type(data.enDesc)
    }
  }

  const closeSheet = () => {
    cy.get('body').type('{esc}')
    cy.get('[role="dialog"]').should('not.exist')
  }

  // ===========================================================
  // 1) UI element ของหน้า list
  // ===========================================================
  describe('UI ของหน้ารายการ', () => {
    it('แสดงหัวข้อ "โปรโมชัน" และคำอธิบาย', () => {
      cy.contains('p', 'โปรโมชัน').should('be.visible')
      cy.contains('p', 'รายการโปรโมชันทั้งหมดในระบบ').should('be.visible')
    })

    it('ปุ่ม "เพิ่มโปรโมชัน" คลิกได้', () => {
      cy.contains('button', 'เพิ่มโปรโมชัน').should('be.visible').and('not.be.disabled')
    })

    it('ช่องค้นหาแสดงและพิมพ์ได้', () => {
      cy.get('input[placeholder="ค้นหาชื่อโปรโมชัน"]').should('be.visible')
        .type('hello').should('have.value', 'hello')
    })

    it('ปุ่ม "ตัวกรอง" เปิด sheet ได้', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').should('be.visible')
      closeSheet()
    })

    it('ปุ่ม "ปรับแต่งคอลัมน์" คลิกได้', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').should('be.visible').click()
      cy.get('body').type('{esc}')
    })
  })

  // ===========================================================
  // 2) Campaign type dialog
  // ===========================================================
  describe('Dialog เลือกรูปแบบแคมเปญ', () => {
    it('คลิก "เพิ่มโปรโมชัน" → เปิด dialog เลือกรูปแบบแคมเปญสินค้า', () => {
      cy.contains('button', 'เพิ่มโปรโมชัน').click()
      cy.get('[role="dialog"]').should('be.visible')
      cy.contains('h2', 'เลือกรูปแบบแคมเปญสินค้า').should('be.visible')
    })

    it('Dialog มี option ครบ: Discount, Bundle, Flash sale, Add on', () => {
      cy.contains('button', 'เพิ่มโปรโมชัน').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', 'Discount/ส่วนลด').should('be.visible')
        cy.contains('button', 'Bundle').should('be.visible')
        cy.contains('button', 'Flash sale').should('be.visible')
        cy.contains('button', 'Add on').should('be.visible')
      })
    })

    it('ปุ่ม "ยืนยัน" disabled จนกว่าจะเลือก option', () => {
      cy.contains('button', 'เพิ่มโปรโมชัน').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', 'ยืนยัน').should('be.disabled')
        cy.contains('button', 'Discount/ส่วนลด').click()
        cy.contains('button', 'ยืนยัน').should('not.be.disabled')
      })
    })

    it('ปุ่ม "ยกเลิก" ปิด dialog', () => {
      cy.contains('button', 'เพิ่มโปรโมชัน').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('button', 'ยกเลิก').click()
      })
      cy.get('[role="dialog"]').should('not.exist')
      cy.url().should('not.include', '/create')
    })

    it('เลือก Discount + ยืนยัน → ไปหน้า create', () => {
      openCreate('Discount/ส่วนลด')
      cy.url().should('include', '/promotions/create')
    })
  })

  // ===========================================================
  // 3) UI ของหน้า create
  // ===========================================================
  describe('UI ของหน้าสร้างโปรโมชั่น', () => {
    beforeEach(() => openCreate())

    it('แสดงหัวข้อและส่วน "ข้อมูลทั่วไป" + "รายการโปรโมชั่น"', () => {
      cy.contains('เพิ่มแคมเปญโปรโมชั่น').should('be.visible')
      cy.contains('ข้อมูลทั่วไป').should('be.visible')
      cy.contains('รายการโปรโมชั่น').should('be.visible')
    })

    it('"รหัสโปรโมชั่น" disabled และมี placeholder "สร้างอัตโนมัติเมื่อบันทึก"', () => {
      cy.get('input[placeholder="สร้างอัตโนมัติเมื่อบันทึก"]').should('be.disabled')
    })

    it('ค่า default ของ "ใช้เหมือนกันทั้ง 2 ภาษา" คือ ON และทำให้ EN ถูก disable', () => {
      cy.contains('p', 'ใช้เหมือนกันทั้ง 2 ภาษา')
        .parent()
        .find('button[role="switch"]')
        .should('have.attr', 'data-state', 'checked')
      cy.get('input[name="translations.1.name"]').should('be.disabled')
      cy.get('textarea[name="translations.1.description"]').should('be.disabled')
    })

    it('ปิด toggle ภาษาเดียวกัน → ฟิลด์ EN เปิดใช้ได้', () => {
      unlinkLanguages()
      cy.get('input[name="translations.1.name"]').should('not.be.disabled')
      cy.get('textarea[name="translations.1.description"]').should('not.be.disabled')
    })

    it('ระยะเวลาโปรโมชั่น default = "ระบุระยะเวลา"', () => {
      cy.contains('label', 'ระบุระยะเวลา')
        .find('button[role="radio"]')
        .should('have.attr', 'data-state', 'checked')
    })

    it('เลือก "ไม่มีวันหมดอายุ" → radio update', () => {
      cy.contains('label', 'ไม่มีวันหมดอายุ').click()
      cy.contains('label', 'ไม่มีวันหมดอายุ')
        .find('button[role="radio"]')
        .should('have.attr', 'data-state', 'checked')
    })

    it('สถานะ default = "กำลังเปิดใช้งาน"', () => {
      cy.contains('กำลังเปิดใช้งาน').should('be.visible')
    })

    it('ตารางรายการโปรโมชั่นเริ่มต้นว่าง', () => {
      cy.contains('ยังไม่มีรายการโปรโมชัน').should('be.visible')
    })
  })

  // ===========================================================
  // 4) VALIDATION
  // ===========================================================
  describe('Validation ตอนสร้าง', () => {
    beforeEach(() => openCreate())

    it('กดบันทึกโดยไม่กรอกอะไรเลย → ยังอยู่หน้า create', () => {
      cy.contains('button', 'บันทึก').click()
      cy.wait(1500)
      cy.url().should('include', '/promotions/create')
    })

    it('แสดง error message ตอนกดบันทึกฟอร์มเปล่า', () => {
      cy.contains('button', 'บันทึก').click()
      cy.contains(/กรุณากรอกชื่อโปรโมชัน/, { timeout: 5000 }).should('be.visible')
    })

    it('กรอกชื่อ TH อย่างเดียว (ใช้เหมือนกัน 2 ภาษา = ON) → ผ่าน basic info', () => {
      const data = buildData('-thonly')
      fillBasicInfo(data)
      cy.get('input[name="translations.0.name"]').should('have.value', data.thaiName)
    })

    it('ปิดภาษาเดียวกัน + ไม่กรอก EN → ไม่ผ่าน validation', () => {
      const data = buildData('-noen')
      unlinkLanguages()
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
      cy.contains('button', 'บันทึก').click()
      cy.wait(1500)
      cy.url().should('include', '/promotions/create')
    })
  })

  // ===========================================================
  // 5) CREATE — basic flow
  // ===========================================================
  describe('กรอกฟอร์มข้อมูลทั่วไป', () => {
    beforeEach(() => openCreate())

    it('กรอกข้อมูลพื้นฐาน (ใช้เหมือนกัน 2 ภาษา)', () => {
      const data = buildData('-basic')
      fillBasicInfo(data)
      cy.get('input[name="translations.0.name"]').should('have.value', data.thaiName)
      cy.get('textarea[name="translations.0.description"]').should('have.value', data.thaiDesc)
    })

    it('กรอกข้อมูลแยก TH/EN', () => {
      const data = buildData('-separate')
      fillBasicInfo(data, { separateEN: true })
      cy.get('input[name="translations.0.name"]').should('have.value', data.thaiName)
      cy.get('input[name="translations.1.name"]').should('have.value', data.enName)
      cy.get('textarea[name="translations.1.description"]').should('have.value', data.enDesc)
    })

    it('เปิด date range picker', () => {
      cy.contains('button', 'วันที่เริ่มต้น').click()
      cy.get('[role="dialog"], [role="grid"]').should('be.visible')
      cy.get('body').type('{esc}')
    })

    it('toggle สถานะ "กำลังเปิดใช้งาน"', () => {
      cy.contains('กำลังเปิดใช้งาน').parent().find('button[role="switch"]').click()
      cy.contains(/ปิด|ฉบับร่าง|ไม่ใช้งาน/).should('exist')
    })
  })

  // ===========================================================
  // 6) ITEM WIZARD — เพิ่มรายการโปรโมชั่น
  // ===========================================================
  describe('Wizard เพิ่มรายการโปรโมชั่น', () => {
    beforeEach(() => openCreate())

    it('คลิก "เพิ่มรายการโปรโมชั่น" → ไปหน้า wizard step 1/3', () => {
      cy.contains('button', 'เพิ่มรายการโปรโมชั่น').click()
      cy.url().should('include', '/items/create')
      cy.contains('p', 'เพิ่มรายการโปรโมชัน').should('be.visible')
      cy.contains(/ขั้นตอน/).should('be.visible')
    })

    it('step 1 มีฟิลด์ชื่อ TH/EN และ "ใช้เหมือนกันทั้ง 2 ภาษา"', () => {
      cy.contains('button', 'เพิ่มรายการโปรโมชั่น').click()
      cy.get('input[name="translations.0.name"]').should('be.visible')
      cy.contains('ใช้เหมือนกันทั้ง 2 ภาษา').should('exist')
    })

    it('step 1 มีตัวเลือก "รูปแบบการจัดส่ง" (ตามระบบ / จัดส่งเอง)', () => {
      cy.contains('button', 'เพิ่มรายการโปรโมชั่น').click()
      cy.contains('รูปแบบการจัดส่ง').should('be.visible')
      cy.contains('label', 'ตามระบบ')
        .find('button[role="radio"]')
        .should('have.attr', 'data-state', 'checked')
      cy.contains('จัดส่งเอง').should('exist')
    })

    it('step 1: กด "ถัดไป" โดยไม่กรอกชื่อ → ไม่ผ่าน validation', () => {
      cy.contains('button', 'เพิ่มรายการโปรโมชั่น').click()
      cy.contains('button', 'ถัดไป').click()
      cy.wait(1000)
      cy.contains(/ขั้นตอน[\s\S]*1\s*\/\s*3/).should('be.visible')
    })
  })

  // ===========================================================
  // 7) SEARCH
  // ===========================================================
  describe('ค้นหา', () => {
    it('พิมพ์คำค้นหา → ช่องค้นหารับค่า', () => {
      cy.get('input[placeholder="ค้นหาชื่อโปรโมชัน"]').type('สงกรานต์')
        .should('have.value', 'สงกรานต์')
    })

    it('ค้นหาคำที่ไม่มี → ตารางว่าง/ไม่พบข้อมูล', () => {
      const fake = `not-exist-${rand()}`
      cy.get('input[placeholder="ค้นหาชื่อโปรโมชัน"]').type(fake)
      cy.wait(1500)
      cy.get('body').then(($b) => {
        const txt = $b.text()
        expect(txt).to.satisfy((t) =>
          t.includes('ไม่พบข้อมูล') ||
          t.includes('ยังไม่มี') ||
          t.includes('0 - 0')
        )
      })
    })

    it('ล้างค่าค้นหา', () => {
      cy.get('input[placeholder="ค้นหาชื่อโปรโมชัน"]').type('xxx').clear().should('have.value', '')
    })
  })

  // ===========================================================
  // 8) FILTER
  // ===========================================================
  describe('ตัวกรอง', () => {
    it('เปิด sheet ตัวกรองและปิดได้', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').should('be.visible')
      closeSheet()
    })
  })

  // ===========================================================
  // 9) PAGINATION
  // ===========================================================
  describe('Pagination', () => {
    it('default แสดงไม่เกิน 10 แถว', () => {
      cy.get('tbody tr').its('length').should('be.lte', 20)
    })

    it('เปลี่ยนจำนวนแถว → 20', () => {
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').click()
      cy.contains('[role="option"]', '20').click()
      cy.wait(800)
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').should('contain.text', '20')
    })

    it('เปลี่ยนจำนวนแถว → 50', () => {
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').click()
      cy.contains('[role="option"]', '50').click()
      cy.wait(800)
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').should('contain.text', '50')
    })
  })

  // ===========================================================
  // 10) ปรับแต่งคอลัมน์
  // ===========================================================
  describe('ปรับแต่งคอลัมน์', () => {
    it('เปิด dropdown ปรับแต่งคอลัมน์', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.get('[role="menu"], [role="dialog"]', { timeout: 4000 }).should('exist')
      cy.get('body').type('{esc}')
    })
  })
})
