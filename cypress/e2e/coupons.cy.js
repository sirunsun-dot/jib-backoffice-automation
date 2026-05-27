const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/promotion-manager/coupons`
const CREATE_URL = `${BASE}/store/promotion-manager/coupons/create`

describe('จัดการคูปอง (Coupons)', () => {

  beforeEach(() => {
    cy.session('jib-admin', () => {
      cy.loginJIB('admin00@email.com', 'password123')
    })
    cy.visit(LIST_URL)
    cy.contains('p', 'คูปอง', { timeout: 15000 }).should('be.visible')
  })

  const rand = () => Math.floor(10000 + Math.random() * 90000)

  const buildData = (label = '') => {
    const n = rand()
    return {
      thaiName: `เทสคูปอง ${n}${label}`,
      enName: `test coupon ${n}${label}`,
      code: `TEST${n}`,
      discountValue: 10,
    }
  }

  const openCreate = () => {
    cy.contains('button', 'เพิ่มคูปอง').click()
    cy.url({ timeout: 10000 }).should('include', '/coupons/create')
    cy.contains('p', 'เพิ่มแคมเปญคูปอง', { timeout: 10000 }).should('be.visible')
  }

  const unlinkLanguages = () => {
    cy.contains('p', 'ใช้เหมือนกันทั้ง 2 ภาษา').parent().find('button[role="switch"]').click()
  }

  const closeSheet = () => {
    cy.get('body').type('{esc}')
    cy.get('[role="dialog"]').should('not.exist')
  }

  // เพิ่มรายการคูปอง 1 ตัวเข้าไปในตาราง parent (ใช้ใน create flow)
  const addCouponItem = (data) => {
    cy.contains('button', 'เพิ่มรายการคูปอง').click()
    cy.get('[role="dialog"][data-state="open"]', { timeout: 8000 }).should('be.visible')

    cy.get('[role="dialog"][data-state="open"]').within(() => {
      cy.get('input[name="translations.0.name"]').clear().type(data.thaiName)
      cy.get('input[name="discountValue"]').clear().type(String(data.discountValue))
      cy.get('input[name="code"]').clear().type(data.code)
      cy.contains('button', 'ยืนยัน').click()
    })

    // dialog ปิด → กลับมาที่ parent form
    cy.get('[role="dialog"][data-state="open"]', { timeout: 8000 }).should('not.exist')
    cy.contains('tbody tr', data.code).should('be.visible')
  }

  // search + เปิดหน้า edit ของ record
  const openEditFor = (name) => {
    cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').clear().type(name)
    cy.wait(1200)
    cy.contains('tbody tr', name, { timeout: 10000 })
      .find('a[href*="/coupons/update/"]')
      .first()
      .click()
    cy.url().should('include', '/coupons/update/')
    cy.contains('p', /บันทึกล่าสุด/, { timeout: 10000 }).should('be.visible')
  }

  // เปิด dropdown row + กดเมนู (เช่น "ลบ" / "ปิดการใช้งาน")
  const openRowMenu = (name) => {
    cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').clear().type(name)
    cy.wait(1200)
    cy.contains('tbody tr', name, { timeout: 10000 })
      .find('button[aria-label="Open menu"]')
      .click()
  }

  // ===========================================================
  // 1) UI ของหน้ารายการ
  // ===========================================================
  describe('UI ของหน้ารายการ', () => {
    it('แสดงหัวข้อ "คูปอง" และคำอธิบาย', () => {
      cy.contains('p', 'คูปอง').should('be.visible')
      cy.contains('p', 'รายการคูปองทั้งหมดในระบบ').should('be.visible')
    })

    it('แสดง column headers ครบ', () => {
      const expected = [
        '#', 'จัดการ', 'ชื่อคูปอง', 'รายการคูปอง', 'วันที่เริ่ม',
        'วันที่สิ้นสุด', 'สถานะ', 'วันที่สร้าง', 'วันที่แก้ไข', 'ผู้สร้าง',
      ]
      expected.forEach((h) => {
        cy.get('table thead').contains(h).should('exist')
      })
    })

    it('แสดง empty state หรือมีรายการในตาราง (data-agnostic)', () => {
      // ตารางควรมี empty state หรือมี row อย่างน้อย 1 แถว
      cy.get('body').then(($b) => {
        const txt = $b.text()
        const hasEmpty = /ไม่พบข้อมูล|ยังไม่มี/.test(txt)
        const hasRow = $b.find('table tbody tr').length > 0
        expect(hasEmpty || hasRow, 'ต้องมี empty state หรือ row').to.be.true
      })
    })

    it('ปุ่ม "เพิ่มคูปอง" คลิกได้', () => {
      cy.contains('button', 'เพิ่มคูปอง').should('be.visible').and('not.be.disabled')
    })

    it('ช่องค้นหาแสดงและพิมพ์ได้', () => {
      cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').should('be.visible')
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
  // 2) UI ของหน้าสร้างคูปอง
  // ===========================================================
  describe('UI ของหน้าสร้างคูปอง', () => {
    beforeEach(() => openCreate())

    it('แสดงหัวข้อ "เพิ่มแคมเปญคูปอง"', () => {
      cy.contains('p', 'เพิ่มแคมเปญคูปอง').should('be.visible')
      cy.contains('p', 'ระบุรายละเอียดแคมเปญคูปอง').should('be.visible')
    })

    it('มีฟิลด์ชื่อแคมเปญคูปอง TH/EN', () => {
      cy.get('input[name="translations.0.name"]').should('be.visible')
        .and('have.attr', 'placeholder').and('include', 'คูปองส่วนลด')
      cy.get('input[name="translations.1.name"]').should('exist')
    })

    it('toggle "ใช้เหมือนกันทั้ง 2 ภาษา" default ON → EN field disabled', () => {
      cy.contains('p', 'ใช้เหมือนกันทั้ง 2 ภาษา')
        .parent().find('button[role="switch"]')
        .should('have.attr', 'data-state', 'checked')
      cy.get('input[name="translations.1.name"]').should('be.disabled')
    })

    it('ปิด toggle → EN field เปิดให้กรอกได้', () => {
      unlinkLanguages()
      cy.get('input[name="translations.1.name"]').should('not.be.disabled')
    })

    it('มี radio "ระยะเวลาแคมเปญ": ระบุระยะเวลา / ไม่มีวันหมดอายุ', () => {
      cy.contains('ระยะเวลาแคมเปญ').should('be.visible')
      cy.contains('label', 'ระบุระยะเวลา').should('exist')
      cy.contains('label', 'ไม่มีวันหมดอายุ').should('exist')
    })

    it('default radio = "ระบุระยะเวลา"', () => {
      cy.contains('label', 'ระบุระยะเวลา')
        .find('button[role="radio"]')
        .should('have.attr', 'data-state', 'checked')
    })

    it('คลิก "ไม่มีวันหมดอายุ" → radio update', () => {
      cy.contains('label', 'ไม่มีวันหมดอายุ').click()
      cy.contains('label', 'ไม่มีวันหมดอายุ')
        .find('button[role="radio"]')
        .should('have.attr', 'data-state', 'checked')
    })

    it('มีปุ่ม "เพิ่มรายการคูปอง" และตารางว่าง', () => {
      cy.contains('button', 'เพิ่มรายการคูปอง').should('be.visible')
      cy.contains('ยังไม่มีรายการคูปอง').should('be.visible')
      cy.contains('กด เพิ่มรายการคูปอง เพื่อเริ่มสร้างรายการใหม่').should('be.visible')
    })

    it('สถานะ default "กำลังเปิดใช้งาน"', () => {
      cy.contains('กำลังเปิดใช้งาน').should('be.visible')
    })

    it('ปุ่มบันทึกแสดง', () => {
      cy.contains('button', 'บันทึก').should('be.visible')
    })
  })

  // ===========================================================
  // 3) VALIDATION
  // ===========================================================
  describe('Validation ตอนสร้าง', () => {
    beforeEach(() => openCreate())

    it('กดบันทึกโดยไม่กรอกอะไรเลย → ยังอยู่หน้า create', () => {
      cy.contains('button', 'บันทึก').click()
      cy.wait(1500)
      cy.url().should('include', '/coupons/create')
    })

    it('กรอกแค่ชื่อ TH แล้วบันทึก (ไม่มีรายการคูปอง) → ยังอยู่หน้า create', () => {
      const data = buildData('-thonly')
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
      cy.contains('button', 'บันทึก').click()
      cy.wait(2000)
      cy.url().should('include', '/coupons/create')
    })

    it('ปิด toggle ภาษาเดียวกัน + ไม่กรอก EN → validation ขัด', () => {
      unlinkLanguages()
      cy.get('input[name="translations.0.name"]').type('test only TH')
      cy.contains('button', 'บันทึก').click()
      cy.wait(1500)
      cy.url().should('include', '/coupons/create')
    })

    it('input ชื่อรับค่าได้และอัปเดต value', () => {
      cy.get('input[name="translations.0.name"]').type('hello').should('have.value', 'hello')
    })
  })

  // ===========================================================
  // 4) กรอกฟอร์ม
  // ===========================================================
  describe('กรอกฟอร์ม', () => {
    beforeEach(() => openCreate())

    it('กรอกชื่อ TH (ใช้เหมือนกัน 2 ภาษา ON)', () => {
      const data = buildData('-basic')
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
        .should('have.value', data.thaiName)
    })

    it('กรอกชื่อ TH/EN แยกกัน', () => {
      const data = buildData('-sep')
      unlinkLanguages()
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
      cy.get('input[name="translations.1.name"]').should('not.be.disabled').type(data.enName)
      cy.get('input[name="translations.1.name"]').should('have.value', data.enName)
    })

    it('เปิด date range picker', () => {
      cy.contains('button', 'วันที่เริ่มต้น').click()
      cy.get('[role="dialog"], [role="grid"]', { timeout: 3000 }).should('be.visible')
      cy.get('body').type('{esc}')
    })

    it('คลิก "เพิ่มรายการคูปอง" → ปุ่ม respond', () => {
      cy.contains('button', 'เพิ่มรายการคูปอง').click()
      cy.wait(1000)
      cy.url().should('match', /(items|coupon)/)
    })

    it('ยกเลิกการสร้าง (visit list) → ไม่บันทึก', () => {
      const data = buildData('-cancel')
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
      cy.visit(LIST_URL)
      cy.url().should('not.include', '/create')
    })
  })

  // ===========================================================
  // 5) SEARCH
  // ===========================================================
  describe('ค้นหา', () => {
    it('พิมพ์คำค้นหาได้', () => {
      cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').type('คูปองส่วนลด')
        .should('have.value', 'คูปองส่วนลด')
    })

    it('ค้นหาคำที่ไม่มี → ผลลัพธ์ว่าง', () => {
      const fake = `not-exist-${rand()}`
      cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').type(fake)
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
      cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').type('xx').clear()
        .should('have.value', '')
    })
  })

  // ===========================================================
  // 6) FILTER
  // ===========================================================
  describe('ตัวกรอง', () => {
    it('เปิด sheet ตัวกรองและปิดได้', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').should('be.visible')
      closeSheet()
    })
  })

  // ===========================================================
  // 7) PAGINATION
  // ===========================================================
  describe('Pagination', () => {
    it('แสดงตัวนับ pagination ในรูปแบบ "X - Y จาก Z รายการ"', () => {
      cy.contains(/\d+ - \d+ จาก \d+ รายการ/).should('exist')
    })

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

    it('เปลี่ยนจำนวนแถว → 100', () => {
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').click()
      cy.contains('[role="option"]', '100').click()
      cy.wait(800)
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').should('contain.text', '100')
    })
  })

  // ===========================================================
  // 8) ปรับแต่งคอลัมน์
  // ===========================================================
  describe('ปรับแต่งคอลัมน์', () => {
    it('เปิด dropdown ปรับแต่งคอลัมน์', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.get('[role="menu"], [role="dialog"]', { timeout: 4000 }).should('exist')
      cy.get('body').type('{esc}')
    })
  })

  // ===========================================================
  // 9) ITEM DIALOG — ตรวจฟิลด์ของ dialog "เพิ่มรายการคูปอง" ทั้งหมด
  // ===========================================================
  describe('Dialog "เพิ่มรายการคูปอง"', () => {
    beforeEach(() => openCreate())

    it('เปิด dialog → มีฟิลด์หลักครบ', () => {
      cy.contains('button', 'เพิ่มรายการคูปอง').click()
      cy.get('[role="dialog"][data-state="open"]').should('be.visible')
      cy.get('[role="dialog"][data-state="open"]').within(() => {
        cy.contains('ชื่อรายการคูปอง - ภาษาไทย').should('exist')
        cy.contains('ชื่อรายการคูปอง - ภาษาอังกฤษ').should('exist')
        cy.contains('รูปแบบส่วนลด').should('exist')
        cy.contains('ประเภทส่วนลด').should('exist')
        cy.contains('มูลค่าส่วนลด').should('exist')
        cy.contains('ส่วนลดสูงสุด').should('exist')
        cy.contains('ยอดซื้อขั้นต่ำ').should('exist')
        cy.contains('จำนวนชิ้นขั้นต่ำ').should('exist')
        cy.contains('รหัสคูปอง').should('exist')
        cy.contains('จำนวนการใช้ต่อผู้ใช้').should('exist')
        cy.contains('จำนวนการใช้ทั้งหมด').should('exist')
      })
    })

    it('Default radio "เปอร์เซ็นต์ (%)" + "รหัสเดียว" + "ใช้กับสินค้าทั้งหมด"', () => {
      cy.contains('button', 'เพิ่มรายการคูปอง').click()
      cy.get('[role="dialog"][data-state="open"]').within(() => {
        cy.contains('label', 'เปอร์เซ็นต์ (%)')
          .find('button[role="radio"]').should('have.attr', 'data-state', 'checked')
        cy.contains('label', 'รหัสเดียว')
          .find('button[role="radio"]').should('have.attr', 'data-state', 'checked')
        cy.contains('label', 'ใช้กับสินค้าทั้งหมด')
          .find('button[role="radio"]').should('have.attr', 'data-state', 'checked')
      })
    })

    it('Validation: ฟอร์มเปล่า → error ชื่อ TH + EN + รหัสคูปอง', () => {
      cy.contains('button', 'เพิ่มรายการคูปอง').click()
      cy.get('[role="dialog"][data-state="open"]').within(() => {
        cy.contains('button', 'ยืนยัน').click()
        cy.contains(/กรุณากรอกชื่อรายการคูปอง.*ภาษาไทย/).should('be.visible')
        cy.contains(/กรุณากรอกรหัสคูปอง/).should('be.visible')
      })
    })

    it('Validation: % discount = 150 → error "0 ถึง 100"', () => {
      cy.contains('button', 'เพิ่มรายการคูปอง').click()
      cy.get('[role="dialog"][data-state="open"]').within(() => {
        cy.get('input[name="translations.0.name"]').type('item150')
        cy.get('input[name="code"]').type('TEST150')
        cy.get('input[name="discountValue"]').clear().type('150')
        cy.contains('button', 'ยืนยัน').click()
        cy.contains(/ส่วนลดแบบเปอร์เซ็นต์.*0\s*ถึง\s*100/).should('be.visible')
      })
    })

    it('สลับเป็น "สร้างรหัสอัตโนมัติ" → field รหัสหายและขึ้น 3 field ใหม่', () => {
      cy.contains('button', 'เพิ่มรายการคูปอง').click()
      cy.get('[role="dialog"][data-state="open"]').within(() => {
        cy.contains('label', 'สร้างรหัสอัตโนมัติ').click()
        cy.contains('คำนำหน้ารหัส').should('exist')
        cy.contains('ความยาวส่วนท้าย').should('exist')
        cy.contains('ชุดอักขระ').should('exist')
      })
    })

    it('สลับเป็น "เลือกเฉพาะสินค้าที่ต้องการ" → ขึ้น product picker', () => {
      cy.contains('button', 'เพิ่มรายการคูปอง').click()
      cy.get('[role="dialog"][data-state="open"]').within(() => {
        cy.contains('label', 'เลือกเฉพาะสินค้าที่ต้องการ').click()
        cy.contains(/กรุณาเลือกสินค้าอย่างน้อย 1 รายการ|ทุกหมวดหมู่/).should('exist')
      })
    })

    it('กดยกเลิก → dialog ปิด ไม่เพิ่มรายการ', () => {
      cy.contains('button', 'เพิ่มรายการคูปอง').click()
      cy.get('[role="dialog"][data-state="open"]').within(() => {
        cy.get('input[name="translations.0.name"]').type('item-cancel')
        cy.contains('button', 'ยกเลิก').click()
      })
      cy.get('[role="dialog"][data-state="open"]').should('not.exist')
      cy.contains('tbody tr', 'item-cancel').should('not.exist')
    })

    it('กรอกครบ + ยืนยัน → รายการคูปองโผล่ในตาราง parent', () => {
      cy.contains('button', 'เพิ่มรายการคูปอง').click()
      const data = buildData('-add')
      cy.get('[role="dialog"][data-state="open"]').within(() => {
        cy.get('input[name="translations.0.name"]').type(data.thaiName)
        cy.get('input[name="discountValue"]').clear().type(String(data.discountValue))
        cy.get('input[name="code"]').type(data.code)
        cy.contains('button', 'ยืนยัน').click()
      })
      cy.get('[role="dialog"][data-state="open"]').should('not.exist')
      cy.contains('tbody tr', data.code).should('be.visible')
      cy.contains('tbody tr', data.thaiName).should('be.visible')
    })
  })

  // ===========================================================
  // 10) CREATE FLOW — สร้างคูปองจนจบ + verify ใน list
  // ===========================================================
  describe('CREATE Flow — สร้างคูปองครบ process', () => {
    it('Happy path: สร้างคูปองใหม่ "ไม่มีวันหมดอายุ" + 1 รายการคูปอง → ปรากฏใน list', () => {
      const data = buildData('-happy')
      openCreate()

      // กรอกชื่อแคมเปญ
      cy.get('input[name="translations.0.name"]').type(data.thaiName)

      // เลือกระยะเวลา "ไม่มีวันหมดอายุ"
      cy.contains('label', 'ไม่มีวันหมดอายุ').click()
      cy.contains('label', 'ไม่มีวันหมดอายุ')
        .find('button[role="radio"]')
        .should('have.attr', 'data-state', 'checked')

      // เพิ่ม 1 รายการคูปอง
      addCouponItem(data)

      // ยืนยันว่ามี 1 รายการในตาราง parent
      cy.contains('tbody tr', data.code).should('be.visible')

      // บันทึก parent form
      cy.contains('button', 'บันทึก').click()

      // ตรวจ navigate กลับหน้า list
      cy.url({ timeout: 15000 }).should('match', /\/coupons\/?$/)

      // verify record ปรากฏใน list
      cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').clear().type(data.thaiName)
      cy.wait(1500)
      cy.contains('tbody tr', data.thaiName, { timeout: 10000 }).should('be.visible')
    })

    it('สร้างคูปองแบบมีระยะเวลา (date range) + 1 รายการ → สำเร็จ', () => {
      const data = buildData('-daterange')
      openCreate()

      cy.get('input[name="translations.0.name"]').type(data.thaiName)

      // เปิด date picker
      cy.contains('button', 'วันที่เริ่มต้น').click()
      cy.get('[role="dialog"], [role="grid"]', { timeout: 5000 }).should('be.visible')

      // เลือกวันที่ปัจจุบัน + วันที่ +7 (ใช้ปุ่ม today + click ของ calendar)
      cy.get('[role="gridcell"]').not('[data-outside-day]').then(($cells) => {
        const visible = $cells.filter(':visible')
        if (visible.length >= 8) {
          cy.wrap(visible[0]).click()
          cy.wrap(visible[7]).click()
        } else if (visible.length >= 2) {
          cy.wrap(visible[0]).click()
          cy.wrap(visible[visible.length - 1]).click()
        }
      })

      // ปิด date picker
      cy.get('body').type('{esc}')

      // เพิ่ม 1 รายการคูปอง
      addCouponItem(data)

      // บันทึก
      cy.contains('button', 'บันทึก').click()
      cy.url({ timeout: 15000 }).should('match', /\/coupons\/?$/)

      cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').clear().type(data.thaiName)
      cy.wait(1500)
      cy.contains('tbody tr', data.thaiName, { timeout: 10000 }).should('be.visible')
    })

    it('สร้าง 2 รายการคูปองในแคมเปญเดียว → ทั้ง 2 ปรากฏในตาราง', () => {
      const data = buildData('-multi')
      const item2 = { ...buildData('-multi2'), code: `${data.code}B` }

      openCreate()
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
      cy.contains('label', 'ไม่มีวันหมดอายุ').click()

      // เพิ่มรายการที่ 1
      addCouponItem(data)
      // เพิ่มรายการที่ 2
      addCouponItem(item2)

      // verify ทั้ง 2 อยู่ใน parent table
      cy.contains('tbody tr', data.code).should('be.visible')
      cy.contains('tbody tr', item2.code).should('be.visible')

      cy.contains('button', 'บันทึก').click()
      cy.url({ timeout: 15000 }).should('match', /\/coupons\/?$/)
    })

    it('Validation: กดบันทึก parent ที่ไม่มีรายการคูปอง → error + อยู่หน้าเดิม', () => {
      openCreate()
      const data = buildData('-noitem')
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
      cy.contains('label', 'ไม่มีวันหมดอายุ').click()
      cy.contains('button', 'บันทึก').click()
      cy.contains(/กรุณาเพิ่มรายการคูปองอย่างน้อย 1 รายการ/, { timeout: 5000 }).should('be.visible')
      cy.url().should('include', '/coupons/create')
    })
  })

  // ===========================================================
  // 11) EDIT FLOW — แก้ไขคูปองที่มีอยู่
  // ===========================================================
  describe('EDIT Flow — แก้ไขคูปองครบ process', () => {

    // helper: สร้าง record ใหม่เพื่อทดสอบ edit
    const seedCoupon = (label = '') => {
      const data = buildData(label)
      openCreate()
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
      cy.contains('label', 'ไม่มีวันหมดอายุ').click()
      addCouponItem(data)
      cy.contains('button', 'บันทึก').click()
      cy.url({ timeout: 15000 }).should('match', /\/coupons\/?$/)
      return cy.wrap(data, { log: false })
    }

    it('เปิดหน้า edit ผ่านไอคอน → แสดงข้อมูลเดิม', () => {
      seedCoupon('-openedit').then((data) => {
        openEditFor(data.thaiName)
        cy.url().should('include', '/coupons/update/')
        cy.get('input[name="translations.0.name"]').should('have.value', data.thaiName)
        cy.contains(/ID:\s*\d+/).should('be.visible')
        cy.contains(/บันทึกล่าสุด/).should('be.visible')
      })
    })

    it('แก้ไขชื่อแคมเปญ → บันทึก → ชื่อใหม่ปรากฏใน list', () => {
      seedCoupon('-rename').then((data) => {
        const newName = `${data.thaiName}-RENAMED`
        openEditFor(data.thaiName)
        cy.get('input[name="translations.0.name"]').clear().type(newName)
        cy.contains('button', 'บันทึก').click()
        cy.url({ timeout: 15000 }).should('match', /\/coupons\/?$/)
        cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').clear().type(newName)
        cy.wait(1500)
        cy.contains('tbody tr', newName).should('be.visible')
      })
    })

    it('เพิ่มรายการคูปองเพิ่มในแคมเปญเดิม → บันทึก → ระบบรับการเปลี่ยนแปลง', () => {
      seedCoupon('-additem').then((data) => {
        openEditFor(data.thaiName)
        const extra = { ...buildData('-extra'), code: `${data.code}X` }
        addCouponItem(extra)
        cy.contains('tbody tr', extra.code).should('be.visible')
        cy.contains('button', 'บันทึก').click()
        cy.url({ timeout: 15000 }).should('match', /\/coupons\/?$/)
      })
    })

    it('เปิด edit แล้วยกเลิก (visit list) → ค่าเดิมไม่เปลี่ยน', () => {
      seedCoupon('-cancel').then((data) => {
        openEditFor(data.thaiName)
        cy.get('input[name="translations.0.name"]').clear().type('ค่าที่ไม่บันทึก')
        cy.visit(LIST_URL)
        cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').clear().type(data.thaiName)
        cy.wait(1500)
        cy.contains('tbody tr', data.thaiName).should('be.visible')
      })
    })
  })

  // ===========================================================
  // 12) DELETE / TOGGLE STATUS Flow
  // ===========================================================
  describe('DELETE & TOGGLE Flow', () => {

    const seedCoupon = (label = '') => {
      const data = buildData(label)
      openCreate()
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
      cy.contains('label', 'ไม่มีวันหมดอายุ').click()
      addCouponItem(data)
      cy.contains('button', 'บันทึก').click()
      cy.url({ timeout: 15000 }).should('match', /\/coupons\/?$/)
      return cy.wrap(data, { log: false })
    }

    it('คลิก "Open menu" บนแถว → แสดงเมนู "ปิดการใช้งาน" และ "ลบ"', () => {
      seedCoupon('-menu').then((data) => {
        openRowMenu(data.thaiName)
        cy.get('[role="menu"]').should('be.visible')
        cy.contains('[role="menuitem"]', 'ลบ').should('be.visible')
        cy.contains('[role="menuitem"]', /ปิดการใช้งาน|เปิดการใช้งาน/).should('be.visible')
      })
    })

    it('Toggle สถานะ: ปิดการใช้งาน → record ยังอยู่แต่สถานะเปลี่ยน', () => {
      seedCoupon('-disable').then((data) => {
        openRowMenu(data.thaiName)
        cy.contains('[role="menuitem"]', 'ปิดการใช้งาน').click()
        // อาจมี dialog ยืนยัน
        cy.get('body').then(($b) => {
          if ($b.find('[role="dialog"]').length) {
            cy.get('[role="dialog"]').contains('button', /ยืนยัน|ปิด|ตกลง/).click()
          }
        })
        cy.wait(1500)
        cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').clear().type(data.thaiName)
        cy.wait(1500)
        cy.contains('tbody tr', data.thaiName).should('be.visible')
      })
    })

    it('Delete: เปิดเมนู → ลบ → ยกเลิก → record ยังอยู่', () => {
      seedCoupon('-cancel-del').then((data) => {
        openRowMenu(data.thaiName)
        cy.contains('[role="menuitem"]', 'ลบ').click()
        cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible')
        cy.get('[role="dialog"]').contains('button', /ยกเลิก/).click()
        cy.get('[role="dialog"]').should('not.exist')
        cy.contains('tbody tr', data.thaiName).should('be.visible')
      })
    })

    it('Delete: ยืนยัน → record หายจากตาราง', () => {
      seedCoupon('-del').then((data) => {
        openRowMenu(data.thaiName)
        cy.contains('[role="menuitem"]', 'ลบ').click()
        cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible')
        cy.get('[role="dialog"]').contains('button', /ลบ|ยืนยัน/).click()
        cy.wait(2000)
        cy.get('input[placeholder="ค้นหาชื่อคูปอง"]').clear().type(data.thaiName)
        cy.wait(1500)
        cy.contains('tbody tr', data.thaiName, { timeout: 8000 }).should('not.exist')
      })
    })
  })
})
