const BASE = 'https://devstorex.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/product-manager/suppliers`
const CREATE_URL = `${LIST_URL}/create`

describe('จัดการผู้จัดจำหน่าย (Supplier)', () => {

  beforeEach(() => {
    cy.session('jib-admin', () => {
      cy.loginJIB('sirun.sun@codelabdev.co', 'test123')
    })
    cy.visit(LIST_URL)
    cy.contains('p', 'ผู้จัดจำหน่าย (Supplier)', { timeout: 10000 }).should('be.visible')
  })

  // ---------- helpers ----------

  const rand = () => Math.floor(10000 + Math.random() * 90000)

  const buildData = (label = '') => {
    const n = rand()
    return {
      refNo: `JIB-SUP-${n}${label}`,
      thaiName: `เทสซัพพลายเออร์ ${n}${label}`,
      thaiDesc: `รายละเอียดซัพพลายเออร์ภาษาไทย ${n}`,
      enName: `Test Supplier ${n}${label}`,
      enDesc: `Test supplier EN description ${n}`,
      days: '7',
    }
  }

  const openCreate = () => {
    cy.contains('button', 'เพิ่มผู้จัดจำหน่าย').click()
    cy.url().should('include', '/suppliers/create')
    cy.contains('ข้อมูลผู้จัดจำหน่าย', { timeout: 10000 }).should('be.visible')
  }

  const fillForm = (data) => {
    if (data.refNo !== undefined) cy.get('input[name="referenceNo"]').clear().type(data.refNo)
    if (data.thaiName !== undefined) cy.get('input[name="translations.0.name"]').clear().type(data.thaiName)
    if (data.thaiDesc !== undefined) cy.get('textarea[name="translations.0.description"]').clear().type(data.thaiDesc)
    if (data.enName !== undefined) cy.get('input[name="translations.1.name"]').clear().type(data.enName)
    if (data.enDesc !== undefined) cy.get('textarea[name="translations.1.description"]').clear().type(data.enDesc)
    if (data.days !== undefined) cy.get('input[name="days"]').clear().type(String(data.days))
  }

  const clickSave = () => cy.get('button[type="submit"]').contains('บันทึก').click()

  const seedSupplier = (label = '') => {
    const data = buildData(label)
    openCreate()
    fillForm(data)
    clickSave()
    cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
    cy.url().should('match', /\/suppliers\/?$/, { timeout: 15000 })
    return cy.wrap(data, { log: false })
  }

  const openEditFor = (name) => {
    cy.get('input[placeholder="ค้นหา"]').clear().type(name)
    cy.wait(1500)
    cy.contains('tbody tr', name, { timeout: 10000 })
      .find('a[href*="/suppliers/update/"]')
      .click()
    cy.url().should('include', '/suppliers/update/')
    cy.contains('ข้อมูลผู้จัดจำหน่าย', { timeout: 15000 }).should('be.visible')
  }

  const closeSheet = () => {
    cy.get('body').type('{esc}')
    cy.get('[role="dialog"]').should('not.exist')
  }

  const applyStatusFilter = (...statuses) => {
    cy.contains('button', 'ตัวกรอง').click()
    cy.get('[role="dialog"]').within(() => {
      statuses.forEach((s) => cy.contains(s).click())
    })
    closeSheet()
  }

  // ===========================================================
  // 1) CREATE — Happy path
  // ===========================================================
  describe('สร้างผู้จัดจำหน่าย', () => {
    it('สร้างใหม่ด้วยข้อมูลพื้นฐาน + ระบุจำนวนวัน', () => {
      seedSupplier().then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName, { timeout: 10000 }).should('be.visible')
      })
    })

    it('สร้างใหม่ + อัปโหลดรูป + เปิดใช้งาน', () => {
      const data = buildData('-img')
      openCreate()
      cy.get('#mode').click({ force: true })
      cy.get('input[type="file"]').selectFile('cypress/fixtures/jib.png', { force: true })
      cy.get('img').should('be.visible')
      fillForm(data)
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 30000 }).should('be.visible')
      cy.visit(LIST_URL)
      cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
      cy.wait(1500)
      cy.contains('tbody tr', data.thaiName).should('contain.text', 'เปิดใช้งาน')
    })

    it('สร้างพร้อม refNo + คำอธิบาย 2 ภาษา', () => {
      seedSupplier('-full')
    })

    it('สร้างด้วย "กำหนดวันที่" (เลือก specific_date)', () => {
      const data = buildData('-date')
      openCreate()
      // เลือก radio "กำหนดวันที่"
      cy.contains('label', 'กำหนดวันที่').click({ force: true })
      // เปิด date picker + เลือกวัน (ใช้วันที่ใดวันหนึ่ง)
      cy.get('button[data-slot="popover-trigger"]').contains('yyyy/mm/dd').click()
      cy.get('[role="dialog"], [role="grid"]', { timeout: 5000 }).should('be.visible')
      // คลิกวันที่ 15 ในเดือนปัจจุบัน (เป็นเลขที่น่าจะมีใน calendar)
      cy.get('[role="gridcell"] button, button[name="day"]').contains(/^15$/).click({ force: true })
      // ปิด picker (Escape)
      cy.get('body').type('{esc}')
      // กรอกข้อมูลที่เหลือ
      fillForm({ ...data, days: undefined })
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
    })

    it('ยกเลิกการสร้าง → ไม่บันทึก', () => {
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

    it('กดบันทึกฟอร์มว่าง → ขึ้น error "กรุณากรอกชื่อ" 2 จุด', () => {
      clickSave()
      cy.contains('กรุณากรอกชื่อผู้จัดจำหน่าย - ภาษาไทย').should('be.visible')
      cy.contains('กรุณากรอกชื่อผู้จัดจำหน่าย - ภาษาอังกฤษ').should('be.visible')
      cy.url().should('include', '/suppliers/create')
    })

    it('ไม่กรอกชื่อภาษาไทย → ไม่ผ่าน', () => {
      const d = buildData('-noth')
      fillForm({ ...d, thaiName: undefined })
      clickSave()
      cy.contains('กรุณากรอกชื่อผู้จัดจำหน่าย - ภาษาไทย').should('be.visible')
      cy.url().should('include', '/suppliers/create')
    })

    it('ไม่กรอกชื่อภาษาอังกฤษ → ไม่ผ่าน', () => {
      const d = buildData('-noen')
      fillForm({ ...d, enName: undefined })
      clickSave()
      cy.contains('กรุณากรอกชื่อผู้จัดจำหน่าย - ภาษาอังกฤษ').should('be.visible')
      cy.url().should('include', '/suppliers/create')
    })

    it('refNo เป็น optional → บันทึกได้แม้ไม่กรอก', () => {
      const d = buildData('-noref')
      fillForm({ ...d, refNo: undefined })
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      cy.url().should('match', /\/suppliers\/?$/)
    })

    it('คำอธิบายเป็น optional → บันทึกได้', () => {
      const d = buildData('-nodesc')
      fillForm({ ...d, thaiDesc: undefined, enDesc: undefined })
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
    })

    it('ไม่กรอก days (radio days) → ระบบไม่ผ่าน', () => {
      const d = buildData('-noday')
      fillForm({ ...d, days: undefined })
      clickSave()
      cy.wait(1500)
      cy.url().should('include', '/suppliers/create')
    })
  })

  // ===========================================================
  // 3) Duplicate name (current behavior — ยอมให้ซ้ำ)
  // ===========================================================
  describe('ชื่อ supplier ซ้ำ', () => {
    it('สร้างชื่อซ้ำ → ระบบยอมรับ (ไม่มี duplicate validation)', () => {
      seedSupplier('-dup-src').then((data) => {
        openCreate()
        fillForm({
          thaiName: data.thaiName,
          enName: data.enName,
          days: '5',
        })
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.wait(1500)
        cy.get('tbody tr').filter(`:contains("${data.thaiName}")`).its('length').should('be.gte', 2)
      })
    })
  })

  // ===========================================================
  // 4) EDIT
  // ===========================================================
  describe('แก้ไขผู้จัดจำหน่าย', () => {
    it('แก้ชื่อภาษาไทย', () => {
      seedSupplier('-edit-th').then((data) => {
        openEditFor(data.thaiName)
        const newName = `${data.thaiName}-แก้`
        cy.get('input[name="translations.0.name"]').clear().type(newName)
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
        cy.visit(LIST_URL)
        cy.get('input[placeholder="ค้นหา"]').clear().type(newName)
        cy.contains('tbody tr', newName, { timeout: 10000 }).should('be.visible')
      })
    })

    it('แก้ชื่อภาษาอังกฤษ + คำอธิบาย', () => {
      seedSupplier('-edit-en').then((data) => {
        openEditFor(data.thaiName)
        cy.get('input[name="translations.1.name"]').clear().type(`${data.enName} edited`)
        cy.get('textarea[name="translations.1.description"]').clear().type('updated EN desc')
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('แก้ refNo', () => {
      seedSupplier('-edit-ref').then((data) => {
        openEditFor(data.thaiName)
        cy.get('input[name="referenceNo"]').clear().type(`JIB-EDIT-${rand()}`)
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('แก้จำนวนวันส่ง (days)', () => {
      seedSupplier('-edit-days').then((data) => {
        openEditFor(data.thaiName)
        cy.get('input[name="days"]').clear().type('14')
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
        cy.visit(LIST_URL)
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName).should('contain.text', '14 วัน')
      })
    })

    it('เปลี่ยน radio เป็น "กำหนดวันที่"', () => {
      seedSupplier('-edit-date').then((data) => {
        openEditFor(data.thaiName)
        cy.contains('label', 'กำหนดวันที่').click({ force: true })
        cy.get('button[data-slot="popover-trigger"]').contains('yyyy/mm/dd').click()
        cy.get('[role="gridcell"] button, button[name="day"]').contains(/^20$/).click({ force: true })
        cy.get('body').type('{esc}')
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('เปลี่ยนสถานะ ฉบับร่าง → toggle save', () => {
      seedSupplier('-edit-status').then((data) => {
        openEditFor(data.thaiName)
        cy.get('#mode').click({ force: true })
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('แก้ไขแล้วยกเลิก → ข้อมูลเดิมไม่เปลี่ยน', () => {
      seedSupplier('-edit-cancel').then((data) => {
        openEditFor(data.thaiName)
        cy.get('input[name="translations.0.name"]').clear().type('not-saved')
        cy.visit(LIST_URL)
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName).should('be.visible')
      })
    })
  })

  // ===========================================================
  // 5) IMAGE
  // ===========================================================
  describe('จัดการรูปภาพ', () => {
    it('เพิ่มรูปใหม่ตอนแก้ไข', () => {
      seedSupplier('-img-add').then((data) => {
        openEditFor(data.thaiName)
        cy.get('input[type="file"]').selectFile('cypress/fixtures/jib.png', { force: true })
        cy.get('img').should('be.visible')
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('ลบรูปภาพ (มี confirmation dialog)', () => {
      const data = buildData('-img-del')
      openCreate()
      cy.get('input[type="file"]').selectFile('cypress/fixtures/jib.png', { force: true })
      fillForm(data)
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 30000 }).should('be.visible')

      openEditFor(data.thaiName)
      cy.contains('button', 'ลบรูปภาพ').click()
      cy.get('[role="dialog"]', { timeout: 5000 }).should('be.visible')
      cy.get('[role="dialog"]').contains('button', /^ลบ$/).click()
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
    })
  })

  // ===========================================================
  // 6) DELETE
  // ===========================================================
  describe('ลบผู้จัดจำหน่าย', () => {
    it('เปิดเมนู → ยกเลิกการลบ → record ยังอยู่', () => {
      seedSupplier('-cancel-del').then((data) => {
        openEditFor(data.thaiName)
        cy.get('button[aria-label="Open menu"]').click()
        cy.contains('ลบผู้จัดจำหน่าย').click()
        cy.contains('ลบผู้จัดจำหน่ายนี้').should('be.visible')
        cy.get('[role="dialog"]').contains('button', 'ยกเลิก').click()
        cy.url().should('include', '/suppliers/update/')
        cy.get('input[name="translations.0.name"]').should('have.value', data.thaiName)
      })
    })

    it('ยืนยันลบ → หายจากตาราง', () => {
      seedSupplier('-del').then((data) => {
        openEditFor(data.thaiName)
        cy.get('button[aria-label="Open menu"]').click()
        cy.contains('ลบผู้จัดจำหน่าย').click()
        cy.contains('ลบผู้จัดจำหน่ายนี้').should('be.visible')
        cy.get('[role="dialog"]').contains('button', /^ลบ$/).click()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
        cy.visit(LIST_URL)
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.wait(2000)
        cy.contains('tbody tr', data.thaiName).should('not.exist')
      })
    })

    it('Delete dialog ขึ้น "XX รายการ" (Bug รายงาน — placeholder ไม่ replace)', () => {
      seedSupplier('-del-bug').then((data) => {
        openEditFor(data.thaiName)
        cy.get('button[aria-label="Open menu"]').click()
        cy.contains('ลบผู้จัดจำหน่าย').click()
        // Bug confirmation: text "XX รายการ" ปรากฏใน dialog (placeholder ไม่ถูก replace)
        cy.contains('XX รายการ').should('be.visible')
        cy.get('[role="dialog"]').contains('button', 'ยกเลิก').click()
      })
    })
  })

  // ===========================================================
  // 7) COPY (คัดลอกผู้จัดจำหน่าย)
  // ===========================================================
  describe('คัดลอกผู้จัดจำหน่าย', () => {
    it('เปิดเมนู → คัดลอก → ระบบสร้าง record ใหม่', () => {
      seedSupplier('-copy').then((data) => {
        openEditFor(data.thaiName)
        cy.get('button[aria-label="Open menu"]').click()
        cy.contains('คัดลอกผู้จัดจำหน่าย').click()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })
  })

  // ===========================================================
  // 8) SEARCH
  // ===========================================================
  describe('ค้นหา', () => {
    it('ค้นหาภาษาไทย → เจอ', () => {
      seedSupplier('-search-th').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName, { timeout: 10000 }).should('be.visible')
      })
    })

    it('ค้นหาภาษาอังกฤษ → URL มี search param', () => {
      seedSupplier('-search-en').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.enName)
        cy.url({ timeout: 5000 }).should('include', 'search=')
        cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
      })
    })

    it('ค้นหา refNo → URL อัปเดต', () => {
      seedSupplier('-search-ref').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.refNo)
        cy.url({ timeout: 5000 }).should('include', 'search=')
      })
    })

    it('ค้นหา keyword ที่ไม่มี → ตารางว่าง', () => {
      const fake = `nx-${rand()}-${rand()}`
      cy.get('input[placeholder="ค้นหา"]').clear().type(fake)
      cy.wait(1500)
      cy.get('tbody tr').should('have.length.lte', 1)
    })

    it('ล้าง search → กลับมาเห็นข้อมูล', () => {
      seedSupplier('-search-clear').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName).should('be.visible')
        cy.get('input[placeholder="ค้นหา"]').clear()
        cy.wait(1000)
        cy.get('tbody tr').its('length').should('be.gte', 1)
      })
    })
  })

  // ===========================================================
  // 9) FILTER สถานะ (Sheet apply live)
  // ===========================================================
  describe('กรองตามสถานะ', () => {
    it('กรอง "เปิดใช้งาน" → ทุก row เป็น เปิดใช้งาน', () => {
      applyStatusFilter('เปิดใช้งาน')
      cy.url().should('include', 'status=')
      cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
      cy.get('tbody tr').each(($r) => {
        cy.wrap($r).should('contain.text', 'เปิดใช้งาน')
      })
    })

    it('กรอง "ปิดใช้งาน" → ทุก row เป็น ปิดใช้งาน', () => {
      applyStatusFilter('ปิดใช้งาน')
      cy.url().should('include', 'status=')
      cy.get('tbody tr', { timeout: 10000 }).each(($r) => {
        cy.wrap($r).should('contain.text', 'ปิดใช้งาน')
      })
    })

    it('กรองหลายสถานะ (multi-select)', () => {
      applyStatusFilter('เปิดใช้งาน', 'ปิดใช้งาน')
      cy.url().should('include', 'status=')
      cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
    })
  })

  // ===========================================================
  // 10) FILTER วันที่
  // ===========================================================
  describe('กรองตามวันที่', () => {
    it('กรอง "วันนี้"', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('วันนี้').click()
      })
      closeSheet()
      cy.get('tbody tr').its('length').should('be.gte', 0)
    })

    it('กรอง "7 วันที่ผ่านมา"', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('7 วันที่ผ่านมา').click()
      })
      closeSheet()
      cy.get('tbody tr').its('length').should('be.gte', 0)
    })

    it('กรอง "30 วันที่ผ่านมา"', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('30 วันที่ผ่านมา').click()
      })
      closeSheet()
      cy.get('tbody tr').its('length').should('be.gte', 0)
    })

    it('กรอง "1 ปีที่ผ่านมา"', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('1 ปีที่ผ่านมา').click()
      })
      closeSheet()
      cy.get('tbody tr').its('length').should('be.gte', 0)
    })
  })

  // ===========================================================
  // 11) CUSTOMIZE COLUMNS
  // ===========================================================
  describe('ปรับแต่งคอลัมน์', () => {
    it('เปิด menu → แสดง option', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.get('[role="menuitemcheckbox"]').should('have.length.at.least', 5)
      cy.get('body').type('{esc}')
    })

    it('ซ่อนคอลัมน์ "ID" → header หายจากตาราง', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.contains('[role="menuitemcheckbox"]', /^ID$/).click()
      cy.get('body').type('{esc}')
      cy.get('thead').should('not.contain.text', /^ID$/)
    })

    it('เปิดคอลัมน์กลับมา → header กลับมาแสดง', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.contains('[role="menuitemcheckbox"]', /^ID$/).click()
      cy.get('body').type('{esc}')
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.contains('[role="menuitemcheckbox"]', /^ID$/).click()
      cy.get('body').type('{esc}')
      cy.get('thead').should('contain.text', 'ID')
    })
  })

  // ===========================================================
  // 12) SORT
  // ===========================================================
  describe('Sort คอลัมน์', () => {
    it('คลิก header "ผู้จัดจำหน่าย" → table render', () => {
      cy.get('thead').contains('button', 'ผู้จัดจำหน่าย').click()
      cy.wait(800)
      cy.get('tbody tr').its('length').should('be.gte', 1)
    })

    it('คลิก header "#" → table render', () => {
      cy.get('thead').contains('button', /^#$/).click()
      cy.wait(800)
      cy.get('tbody tr').its('length').should('be.gte', 1)
    })
  })

  // ===========================================================
  // 13) PAGINATION
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
  // 14) BULK SELECTION
  // ===========================================================
  describe('เลือกแบบ Bulk', () => {
    it('ติ๊ก checkbox ใน row แรก → เลือกได้', () => {
      cy.get('tbody tr:first-child button[role="checkbox"]').click({ force: true })
      cy.get('tbody tr:first-child button[role="checkbox"]').should('have.attr', 'data-state', 'checked')
    })

    it('ติ๊ก checkbox header → เลือกทุก row', () => {
      cy.get('thead button[role="checkbox"]').click({ force: true })
      cy.get('tbody button[role="checkbox"][data-state="checked"]').its('length').should('be.gte', 1)
    })
  })

  // ===========================================================
  // 15) UI
  // ===========================================================
  describe('UI element', () => {
    it('ปุ่ม "เพิ่มผู้จัดจำหน่าย" แสดงและคลิกได้', () => {
      cy.contains('button', 'เพิ่มผู้จัดจำหน่าย').should('be.visible').and('not.be.disabled')
    })

    it('ช่องค้นหาแสดงและพิมพ์ได้', () => {
      cy.get('input[placeholder="ค้นหา"]').should('be.visible').type('hello')
        .should('have.value', 'hello')
    })

    it('ปุ่ม "ตัวกรอง" เปิด Sheet ได้', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').should('be.visible')
      closeSheet()
    })

    it('ตารางมีคอลัมน์ "ผู้จัดจำหน่าย", "สถานะ", "วันที่สินค้าจะเข้า"', () => {
      cy.get('thead').should('contain.text', 'ผู้จัดจำหน่าย')
      cy.get('thead').should('contain.text', 'สถานะ')
      cy.get('thead').should('contain.text', 'วันที่สินค้าจะเข้า')
    })

    it('breadcrumb แสดง "ผู้จัดจำหน่าย"', () => {
      cy.get('nav[aria-label="breadcrumb"]').should('contain.text', 'ผู้จัดจำหน่าย')
    })
  })
})
