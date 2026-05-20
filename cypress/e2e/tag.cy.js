const BASE = 'https://backoffice.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/product-manager/tags`
const CREATE_URL = `${LIST_URL}/create`

describe('จัดการแท็กสินค้า (Tag)', () => {

  beforeEach(() => {
    cy.session('jib-admin', () => {
      cy.loginJIB('admin00@email.com', 'password123')
    })
    cy.visit(LIST_URL)
    cy.contains('p', 'แท็กสินค้า', { timeout: 10000 }).should('be.visible')
  })

  // ---------- helpers ----------

  const rand = () => Math.floor(10000 + Math.random() * 90000)

  const buildData = (label = '') => {
    const n = rand()
    return {
      thaiName: `เทสแท็ก ${n}${label}`,
      enName: `Test Tag ${n}${label}`,
    }
  }

  const openCreate = () => {
    cy.contains('button', 'เพิ่มแท็กสินค้า').click()
    cy.url().should('include', '/tags/create', { timeout: 10000 })
    cy.contains('เพิ่มแท็กสินค้า', { timeout: 15000 }).should('be.visible')
  }

  const fillForm = (data) => {
    if (data.thaiName !== undefined) cy.get('input[name="translations.0.name"]').clear().type(data.thaiName)
    if (data.enName !== undefined) cy.get('input[name="translations.1.name"]').clear().type(data.enName)
  }

  const clickSave = () => cy.get('button[type="submit"]').contains('บันทึก').click()

  const seedTag = (label = '') => {
    const data = buildData(label)
    openCreate()
    fillForm(data)
    clickSave()
    cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
    cy.url().should('match', /\/tags\/?$/, { timeout: 15000 })
    return cy.wrap(data, { log: false })
  }

  const openEditFor = (name) => {
    cy.get('input[placeholder="ค้นหา"]').clear().type(name)
    cy.wait(1500)
    cy.contains('tbody tr', name, { timeout: 10000 })
      .find('a[href*="/tags/update/"]')
      .click()
    cy.url().should('include', '/tags/update/')
    cy.contains('แก้ไขแท็ก', { timeout: 15000 }).should('be.visible')
  }

  // เปิด filter dialog + ติ๊กสถานะ + ตกลง
  const applyStatusFilter = (...statuses) => {
    cy.contains('button', 'สถานะ').click()
    cy.get('[role="dialog"]').within(() => {
      statuses.forEach((s) => cy.contains(s).click())
      cy.contains('button', 'ตกลง').click()
    })
    cy.get('[role="dialog"]').should('not.exist')
  }

  // ===========================================================
  // 1) CREATE — Happy path
  // ===========================================================
  describe('สร้างแท็ก', () => {
    it('สร้างใหม่ด้วยชื่อ TH/EN', () => {
      seedTag().then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName, { timeout: 10000 }).should('be.visible')
      })
    })

    it('สร้างแล้วเปิดใช้งานทันที (toggle on)', () => {
      const data = buildData('-active')
      openCreate()
      cy.get('#mode').then(($el) => $el[0].click())
      fillForm(data)
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
      cy.wait(1500)
      cy.contains('tbody tr', data.thaiName).should('contain.text', 'เปิดใช้งาน')
    })

    it('ยกเลิกการสร้าง (visit list) → ไม่บันทึก', () => {
      const data = buildData('-cancel')
      openCreate()
      fillForm(data)
      cy.visit(LIST_URL)
      cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
      cy.wait(1500)
      cy.contains('tbody tr', data.thaiName).should('not.exist')
    })
  })

  // ===========================================================
  // 2) CREATE — Validation
  // ===========================================================
  describe('Validation ตอนสร้าง', () => {
    beforeEach(() => openCreate())

    it('กดบันทึกฟอร์มว่าง → error "กรุณากรอกชื่อ" 2 จุด', () => {
      clickSave()
      cy.get('body').then(($b) => {
        const matches = ($b.text().match(/กรุณากรอกชื่อ/g) || []).length
        expect(matches).to.be.at.least(2)
      })
      cy.url().should('include', '/tags/create')
    })

    it('ไม่กรอกชื่อภาษาไทย → ไม่ผ่าน', () => {
      const d = buildData('-noth')
      fillForm({ ...d, thaiName: undefined })
      clickSave()
      cy.contains('กรุณากรอกชื่อ').should('be.visible')
      cy.url().should('include', '/tags/create')
    })

    it('ไม่กรอกชื่อภาษาอังกฤษ → ไม่ผ่าน', () => {
      const d = buildData('-noen')
      fillForm({ ...d, enName: undefined })
      clickSave()
      cy.contains('กรุณากรอกชื่อ').should('be.visible')
      cy.url().should('include', '/tags/create')
    })
  })

  // ===========================================================
  // 3) Duplicate name
  // ===========================================================
  describe('ชื่อแท็กซ้ำ', () => {
    it('สร้างชื่อซ้ำ → ตรวจ behavior (อาจ accept หรือ reject)', () => {
      seedTag('-dup-src').then((data) => {
        openCreate()
        fillForm({ thaiName: data.thaiName, enName: data.enName })
        clickSave()
        // ระบบอาจ accept (สร้าง) หรือ reject (silent 400)
        cy.wait(3000)
        cy.url().then((url) => {
          if (url.includes('/tags/create')) {
            // silent fail (เหมือน supplier bug)
            cy.log('Tag duplicate → API silent fail (Bug)')
          } else {
            cy.log('Tag duplicate → accepted')
          }
        })
      })
    })
  })

  // ===========================================================
  // 4) EDIT
  // ===========================================================
  describe('แก้ไขแท็ก', () => {
    it('แก้ชื่อภาษาไทย', () => {
      seedTag('-edit-th').then((data) => {
        openEditFor(data.thaiName)
        const newName = `${data.thaiName}-แก้`
        cy.get('input[name="translations.0.name"]').clear().type(newName)
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
        cy.url().should('match', /\/tags\/?$/, { timeout: 15000 })
        cy.get('input[placeholder="ค้นหา"]').clear().type(newName)
        cy.contains('tbody tr', newName, { timeout: 10000 }).should('be.visible')
      })
    })

    it('แก้ชื่อภาษาอังกฤษ', () => {
      seedTag('-edit-en').then((data) => {
        openEditFor(data.thaiName)
        const newEn = `${data.enName} edited`
        cy.get('input[name="translations.1.name"]').clear().type(newEn)
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('Toggle ฉบับร่าง → active + save', () => {
      seedTag('-edit-status').then((data) => {
        openEditFor(data.thaiName)
        cy.get('#mode').then(($el) => $el[0].click())
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('แก้แล้วยกเลิก (visit list) → ข้อมูลเดิมไม่เปลี่ยน', () => {
      seedTag('-edit-cancel').then((data) => {
        openEditFor(data.thaiName)
        cy.get('input[name="translations.0.name"]').clear().type('not-saved')
        cy.visit(LIST_URL)
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName).should('be.visible')
      })
    })
  })

  // ===========================================================
  // 5) DELETE
  // ===========================================================
  describe('ลบแท็ก', () => {
    it('เปิดเมนู → ยกเลิกการลบ → record ยังอยู่', () => {
      seedTag('-cancel-del').then((data) => {
        openEditFor(data.thaiName)
        cy.get('button[aria-label="Open menu"]').click()
        cy.contains('ลบแท็ก').click()
        cy.contains('ยืนยันลบแท็กนี้ใช่หรือไม่').should('be.visible')
        cy.get('[role="dialog"]').contains('button', 'ยกเลิก').click()
        cy.url().should('include', '/tags/update/')
        cy.get('input[name="translations.0.name"]').should('have.value', data.thaiName)
      })
    })

    it('ยืนยันลบ → หายจากตาราง', () => {
      seedTag('-del').then((data) => {
        openEditFor(data.thaiName)
        cy.get('button[aria-label="Open menu"]').click()
        cy.contains('ลบแท็ก').click()
        cy.contains('ยืนยันลบแท็กนี้ใช่หรือไม่').should('be.visible')
        cy.get('[role="dialog"]').contains('button', /^ลบ$/).click()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
        cy.visit(LIST_URL)
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.wait(2000)
        cy.contains('tbody tr', data.thaiName).should('not.exist')
      })
    })
  })

  // ===========================================================
  // 6) COPY (คัดลอกแท็ก)
  // ===========================================================
  describe('คัดลอกแท็ก', () => {
    it('เปิดเมนู → คัดลอก → ระบบสร้าง record ใหม่', () => {
      seedTag('-copy').then((data) => {
        openEditFor(data.thaiName)
        cy.get('button[aria-label="Open menu"]').click()
        cy.contains('คัดลอกแท็ก').click()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })
  })

  // ===========================================================
  // 7) SEARCH
  // ===========================================================
  describe('ค้นหา', () => {
    it('ค้นหาภาษาไทย → เจอ', () => {
      seedTag('-search-th').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName, { timeout: 10000 }).should('be.visible')
      })
    })

    it('ค้นหาภาษาอังกฤษ → URL มี search param', () => {
      seedTag('-search-en').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.enName)
        cy.url({ timeout: 5000 }).should('include', 'search=')
        cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
      })
    })

    it('ค้นหา keyword ไม่มี → ตารางว่าง', () => {
      const fake = `nx-${rand()}-${rand()}`
      cy.get('input[placeholder="ค้นหา"]').clear().type(fake)
      cy.wait(1500)
      cy.get('tbody tr').should('have.length.lte', 1)
    })

    it('ล้าง search → กลับมาเห็นข้อมูล', () => {
      seedTag('-search-clear').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName).should('be.visible')
        cy.get('input[placeholder="ค้นหา"]').clear()
        cy.wait(1000)
        cy.get('tbody tr').its('length').should('be.gte', 1)
      })
    })
  })

  // ===========================================================
  // 8) FILTER (popover ปุ่ม "สถานะ" + ตกลง/ยกเลิก)
  // ===========================================================
  describe('กรองตามสถานะ', () => {
    it('กรอง "เปิดใช้งาน" → ทุก row เป็น เปิดใช้งาน', () => {
      applyStatusFilter('เปิดใช้งาน')
      cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
      cy.get('tbody tr').each(($r) => {
        cy.wrap($r).should('contain.text', 'เปิดใช้งาน')
      })
    })

    it('กรอง "ฉบับร่าง" → ทุก row เป็น ฉบับร่าง', () => {
      applyStatusFilter('ฉบับร่าง')
      cy.get('tbody tr', { timeout: 10000 }).each(($r) => {
        cy.wrap($r).should('contain.text', 'ฉบับร่าง')
      })
    })

    it('เปิด filter → ยกเลิก → ไม่ apply', () => {
      cy.contains('button', 'สถานะ').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('เปิดใช้งาน').click()
        cy.contains('button', 'ยกเลิก').click()
      })
      cy.get('[role="dialog"]').should('not.exist')
    })

    // Bug check: Filter description "unDescription"
    it('[Bug] Filter dialog description ขึ้น "unDescription"', () => {
      cy.contains('button', 'สถานะ').click()
      cy.get('[role="dialog"]').should('contain.text', 'unDescription')
      cy.get('[role="dialog"]').contains('button', 'ยกเลิก').click()
    })

    // Bug check: Filter ไม่มีตัวเลือก "ปิดใช้งาน"
    it('[Bug] Filter ไม่มีตัวเลือก "ปิดใช้งาน" (มีแค่ เปิดใช้งาน + ฉบับร่าง)', () => {
      cy.contains('button', 'สถานะ').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('เปิดใช้งาน').should('exist')
        cy.contains('ฉบับร่าง').should('exist')
        // ปิดใช้งาน ไม่ควรมี — ถ้ามีแปลว่า dev แก้แล้ว (test fail = good)
        cy.contains('ปิดใช้งาน').should('not.exist')
      })
      cy.get('[role="dialog"]').contains('button', 'ยกเลิก').click()
    })
  })

  // ===========================================================
  // 9) CUSTOMIZE COLUMNS
  // ===========================================================
  describe('ปรับแต่งคอลัมน์', () => {
    it('เปิด menu → แสดง option', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.get('[role="menuitemcheckbox"]', { timeout: 5000 }).should('have.length.at.least', 3)
      cy.get('body').type('{esc}')
    })

    it('ซ่อนคอลัมน์ "ผู้สร้าง" → header หาย', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.contains('[role="menuitemcheckbox"]', 'ผู้สร้าง').click()
      cy.get('body').type('{esc}')
      cy.get('thead').should('not.contain.text', 'ผู้สร้าง')
    })

    it('เปิดคอลัมน์กลับมา', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.contains('[role="menuitemcheckbox"]', 'ผู้สร้าง').click()
      cy.get('body').type('{esc}')
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.contains('[role="menuitemcheckbox"]', 'ผู้สร้าง').click()
      cy.get('body').type('{esc}')
      cy.get('thead').should('contain.text', 'ผู้สร้าง')
    })
  })

  // ===========================================================
  // 10) PAGINATION
  // ===========================================================
  describe('Pagination', () => {
    it('default แสดงไม่เกิน 10 แถว', () => {
      cy.get('tbody tr').its('length').should('be.lte', 10)
    })

    it('เปลี่ยนจำนวนแถว → 20', () => {
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').click()
      cy.contains('[role="option"]', '20').click()
      cy.get('tbody tr', { timeout: 10000 }).its('length').should('be.lte', 20)
    })

    it('เปลี่ยนจำนวนแถว → 50', () => {
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').click()
      cy.contains('[role="option"]', '50').click()
      cy.get('tbody tr', { timeout: 10000 }).its('length').should('be.lte', 50)
    })
  })

  // ===========================================================
  // 11) UI
  // ===========================================================
  describe('UI element', () => {
    it('ปุ่ม "เพิ่มแท็กสินค้า" แสดงและคลิกได้', () => {
      cy.contains('button', 'เพิ่มแท็กสินค้า').should('be.visible').and('not.be.disabled')
    })

    it('ช่องค้นหาแสดงและพิมพ์ได้', () => {
      cy.get('input[placeholder="ค้นหา"]').should('be.visible').type('hello')
        .should('have.value', 'hello')
    })

    it('ปุ่ม "สถานะ" เปิด filter dialog ได้', () => {
      cy.contains('button', 'สถานะ').click()
      cy.get('[role="dialog"]').should('be.visible')
      cy.get('[role="dialog"]').contains('button', 'ยกเลิก').click()
    })

    it('ตารางมีคอลัมน์ "แท็ก", "สถานะ"', () => {
      cy.get('thead').should('contain.text', 'แท็ก')
      cy.get('thead').should('contain.text', 'สถานะ')
    })

    it('breadcrumb แสดง "แท็กสินค้า"', () => {
      cy.get('nav[aria-label="breadcrumb"]').should('contain.text', 'แท็กสินค้า')
    })
  })
})
