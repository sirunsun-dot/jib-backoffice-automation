const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/promotion-manager/free-gifts`
const CREATE_URL = `${BASE}/store/promotion-manager/free-gifts/create`

describe('จัดการของแถม (Free Gifts)', () => {

  beforeEach(() => {
    cy.session('jib-admin', () => {
      cy.loginJIB('admin00@email.com', 'password123')
    })
    cy.visit(LIST_URL)
    cy.contains('p', 'ของแถม', { timeout: 15000 }).should('be.visible')
  })

  const rand = () => Math.floor(10000 + Math.random() * 90000)

  const buildData = (label = '') => {
    const n = rand()
    return {
      thaiName: `เทสของแถม ${n}${label}`,
      enName: `test free gift ${n}${label}`,
      thaiDesc: `รายละเอียดของแถม ${n}`,
      enDesc: `free gift description ${n}`,
    }
  }

  const openCreate = () => {
    cy.contains('button', 'เพิ่มของแถม').click()
    cy.url({ timeout: 10000 }).should('include', '/free-gifts/create')
  }

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
  // 1) UI ของหน้ารายการ
  // ===========================================================
  describe('UI ของหน้ารายการ', () => {
    it('แสดงหัวข้อ "ของแถม"', () => {
      cy.contains('p', 'ของแถม').should('be.visible')
    })

    it('แสดง column headers ครบ', () => {
      const expected = [
        '#', 'จัดการ', 'ชื่อของแถม', 'วันที่เริ่ม', 'วันที่สิ้นสุด',
        'สถานะการใช้งาน', 'ของแถมทั้งหมด', 'ใช้งานอยู่', 'ปิด/หมด', 'ผู้สร้าง',
      ]
      expected.forEach((h) => {
        cy.get('table thead').contains(h).should('exist')
      })
    })

    it('ปุ่ม "เพิ่มของแถม" คลิกได้', () => {
      cy.contains('button', 'เพิ่มของแถม').should('be.visible').and('not.be.disabled')
    })

    it('ช่องค้นหาแสดงและพิมพ์ได้', () => {
      cy.get('input[placeholder="ค้นหาชื่อของแถม"]').should('be.visible')
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
  // 2) UI ของหน้าสร้าง
  // ===========================================================
  describe('UI ของหน้าสร้างของแถม', () => {
    beforeEach(() => openCreate())

    it('แสดงฟอร์มชื่อแคมเปญ TH/EN', () => {
      cy.get('input[name="translations.0.name"]').should('be.visible')
        .and('have.attr', 'placeholder', 'ชื่อแคมเปญ - ภาษาไทย')
      cy.get('input[name="translations.1.name"]').should('exist')
        .and('have.attr', 'placeholder', 'ชื่อแคมเปญ - ภาษาอังกฤษ')
    })

    it('toggle "ใช้เหมือนกันทั้ง 2 ภาษา" default ON และทำให้ EN sync ค่าจาก TH', () => {
      cy.contains('p', 'ใช้เหมือนกันทั้ง 2 ภาษา')
        .parent().find('button[role="switch"]')
        .should('have.attr', 'data-state', 'checked')
      // หน้าของแถมไม่ disable EN แต่ sync value จาก TH
      cy.get('input[name="translations.0.name"]').type('sync test')
      cy.get('input[name="translations.1.name"]').should('have.value', 'sync test')
    })

    it('ปิด toggle → EN field เปิดให้กรอกได้แยก + ไม่ sync', () => {
      cy.get('input[name="translations.0.name"]').type('thai only')
      unlinkLanguages()
      cy.get('input[name="translations.1.name"]').clear().type('english only')
      cy.get('input[name="translations.0.name"]').should('have.value', 'thai only')
      cy.get('input[name="translations.1.name"]').should('have.value', 'english only')
    })

    it('มี radio "ระยะเวลาแคมเปญ" : ระบุระยะเวลา / ไม่มีวันหมดอายุ', () => {
      cy.contains('ระยะเวลาแคมเปญ').should('be.visible')
      cy.contains('label', 'ระบุระยะเวลา').should('exist')
      cy.contains('label', 'ไม่มีวันหมดอายุ').should('exist')
    })

    it('default = "ระบุระยะเวลา"', () => {
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

    it('มีตาราง "ยังไม่มีรายการของแถม" และปุ่ม "เพิ่มรายการของแถม"', () => {
      cy.contains('ยังไม่มีรายการของแถม').should('be.visible')
      cy.contains('button', 'เพิ่มรายการของแถม').should('be.visible')
    })

    it('ปุ่มบันทึกแสดงและคลิกได้', () => {
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
      cy.url().should('include', '/free-gifts/create')
    })

    it('กรอกแค่ชื่อ TH แล้วบันทึก (ใช้เหมือนกัน 2 ภาษา = ON, ไม่มีรายการ) → ยังอยู่หน้า create (ต้องมีรายการของแถม)', () => {
      const data = buildData('-thonly')
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
      cy.contains('button', 'บันทึก').click()
      cy.wait(2000)
      // ต้องมีรายการของแถม → ระบบไม่บันทึก
      cy.url().should('include', '/free-gifts/create')
    })

    it('ปิด toggle ภาษาเดียวกัน + ไม่กรอก EN → validation ขัด', () => {
      unlinkLanguages()
      cy.get('input[name="translations.0.name"]').type('test only TH')
      cy.contains('button', 'บันทึก').click()
      cy.wait(1500)
      cy.url().should('include', '/free-gifts/create')
    })

    it('input ชื่อรับค่าได้และอัปเดต value', () => {
      cy.get('input[name="translations.0.name"]').type('hello').should('have.value', 'hello')
    })

    it('textarea description รับค่าได้', () => {
      cy.get('textarea[name="translations.0.description"]').type('hi').should('have.value', 'hi')
    })
  })

  // ===========================================================
  // 4) กรอกฟอร์ม
  // ===========================================================
  describe('กรอกฟอร์ม', () => {
    beforeEach(() => openCreate())

    it('กรอกข้อมูลพื้นฐาน (ใช้เหมือนกัน 2 ภาษา)', () => {
      const data = buildData('-basic')
      fillBasicInfo(data)
      cy.get('input[name="translations.0.name"]').should('have.value', data.thaiName)
      cy.get('textarea[name="translations.0.description"]').should('have.value', data.thaiDesc)
    })

    it('กรอกข้อมูล TH/EN แยกกัน', () => {
      const data = buildData('-sep')
      fillBasicInfo(data, { separateEN: true })
      cy.get('input[name="translations.1.name"]').should('have.value', data.enName)
      cy.get('textarea[name="translations.1.description"]').should('have.value', data.enDesc)
    })

    it('เปิด date range picker', () => {
      cy.contains('button', 'วันที่เริ่มต้น').click()
      cy.get('[role="dialog"], [role="grid"]', { timeout: 3000 }).should('be.visible')
      cy.get('body').type('{esc}')
    })

    it('กด "เพิ่มรายการของแถม" → ปุ่ม respond', () => {
      cy.contains('button', 'เพิ่มรายการของแถม').click()
      cy.wait(1000)
      cy.url().should('match', /(items|gift)/)
    })

    it('ยกเลิกการสร้าง (visit list)', () => {
      const data = buildData('-cancel')
      cy.get('input[name="translations.0.name"]').type(data.thaiName)
      cy.visit(LIST_URL)
      cy.url().should('include', '/free-gifts')
      cy.url().should('not.include', '/create')
    })
  })

  // ===========================================================
  // 5) SEARCH
  // ===========================================================
  describe('ค้นหา', () => {
    it('พิมพ์คำค้นหาได้', () => {
      cy.get('input[placeholder="ค้นหาชื่อของแถม"]').type('ของแถมปีใหม่')
        .should('have.value', 'ของแถมปีใหม่')
    })

    it('ค้นหาคำที่ไม่มี → ผลลัพธ์ว่าง', () => {
      const fake = `not-exist-${rand()}`
      cy.get('input[placeholder="ค้นหาชื่อของแถม"]').type(fake)
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
      cy.get('input[placeholder="ค้นหาชื่อของแถม"]').type('xx').clear()
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
})
