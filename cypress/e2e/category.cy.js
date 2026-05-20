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

  const rand = () => Math.floor(10000 + Math.random() * 90000)

  const buildData = (label = '') => {
    const n = rand()
    return {
      refNo: `jibtest${n}${label}`,
      slug: `jib${n}${label}`,
      thaiName: `เทสหมวดหมู่ ${n}${label}`,
      thaiDesc: `รายละเอียดภาษาไทย ${n}`,
      enName: `test category ${n}${label}`,
      enDesc: `english description ${n}`,
    }
  }

  // เปิดหน้า create
  const openCreate = () => {
    cy.contains('button', 'เพิ่มหมวดหมู่สินค้า').click()
    cy.url().should('include', '/categories/create')
  }

  // กรอกฟอร์ม (ไม่กดบันทึก)
  const fillForm = (data) => {
    if (data.refNo !== undefined) cy.get('input[name="referenceNo"]').clear().type(data.refNo)
    if (data.slug !== undefined) cy.get('input[name="slug"]').clear().type(data.slug)
    if (data.thaiName !== undefined) cy.get('input[name="translations.0.name"]').clear().type(data.thaiName)
    if (data.thaiDesc !== undefined) cy.get('textarea[name="translations.0.description"]').clear().type(data.thaiDesc)
    if (data.enName !== undefined) cy.get('input[name="translations.1.name"]').clear().type(data.enName)
    if (data.enDesc !== undefined) cy.get('textarea[name="translations.1.description"]').clear().type(data.enDesc)
  }

  // สร้าง record ใหม่แบบ default (draft, ไม่มีรูป) แล้วคืน data
  const seedCategory = (label = '') => {
    const data = buildData(label)
    openCreate()
    fillForm(data)
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
    cy.contains('ข้อมูลหมวดหมู่สินค้า', { timeout: 15000 }).should('be.visible')
  }

  // ปิด Sheet filter (apply live ไม่มีปุ่มยืนยัน)
  const closeSheet = () => {
    cy.get('body').type('{esc}')
    cy.get('[role="dialog"]').should('not.exist')
  }

  // เปิด filter sheet + ติ๊กสถานะ
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
  describe('สร้างหมวดหมู่', () => {
    it('สร้างใหม่ด้วยข้อมูลพื้นฐาน (ฉบับร่าง)', () => {
      seedCategory().then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName).should('be.visible')
      })
    })

    it('สร้างใหม่พร้อมอัปโหลดรูปภาพและเปิดใช้งาน', () => {
      const data = buildData('-img')
      openCreate()
      cy.get('#mode').click({ force: true })
      cy.get('input[accept="image/*"]').selectFile('cypress/fixtures/jib.png', { force: true })
      cy.get('img').should('be.visible')
      fillForm(data)
      cy.contains('button', 'บันทึก').click()
      cy.contains('สร้างหมวดหมู่สินค้าสำเร็จแล้ว', { timeout: 15000 }).should('be.visible')
      cy.url().should('match', /\/categories\/?$/)
      cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
      cy.contains('tbody tr', data.thaiName).should('contain.text', 'เปิดใช้งาน')
    })

    it('ยกเลิกการสร้าง (กดย้อนกลับ/cancel) ไม่บันทึกข้อมูล', () => {
      const data = buildData('-cancel')
      openCreate()
      fillForm(data)
      // กดย้อนกลับ / ยกเลิก — เลือก path safe โดยกลับไปหน้า list ตรงๆ
      cy.visit(LIST_URL)
      cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
      cy.contains('tbody tr', data.thaiName, { timeout: 5000 }).should('not.exist')
    })
  })

  // ===========================================================
  // 2) CREATE — Validation
  // ===========================================================
  describe('Validation ตอนสร้าง', () => {
    beforeEach(() => openCreate())

    it('กดบันทึกโดยไม่กรอกอะไรเลย → ยังอยู่หน้า create', () => {
      cy.contains('button', 'บันทึก').click()
      cy.wait(1500)
      cy.url().should('include', '/categories/create')
    })

    // refNo และ slug เป็น optional field (ระบบ auto-generate ถ้าไม่ใส่)
    it('ไม่กรอก referenceNo → ระบบยังบันทึกได้ (optional)', () => {
      const d = buildData('-noref')
      fillForm({ ...d, refNo: undefined })
      cy.contains('button', 'บันทึก').click()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      cy.url().should('match', /\/categories\/?$/)
    })

    it('ไม่กรอก slug → ระบบยังบันทึกได้ (optional/auto-generate)', () => {
      const d = buildData('-noslug')
      fillForm({ ...d, slug: undefined })
      cy.contains('button', 'บันทึก').click()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      cy.url().should('match', /\/categories\/?$/)
    })

    it('ไม่กรอกชื่อภาษาไทย → ไม่ผ่าน', () => {
      const d = buildData('-noth')
      fillForm({ ...d, thaiName: undefined })
      cy.contains('button', 'บันทึก').click()
      cy.wait(1500)
      cy.url().should('include', '/categories/create')
    })

    it('ไม่กรอกชื่อภาษาอังกฤษ → ไม่ผ่าน', () => {
      const d = buildData('-noen')
      fillForm({ ...d, enName: undefined })
      cy.contains('button', 'บันทึก').click()
      cy.wait(1500)
      cy.url().should('include', '/categories/create')
    })
  })

  // ===========================================================
  // 3) CREATE — ข้อมูลซ้ำ
  // ===========================================================
  describe('สร้างซ้ำ refNo / slug', () => {
    it('ใช้ refNo + slug ซ้ำกับที่มีอยู่ → ไม่บันทึก (ยังอยู่หน้า create)', () => {
      seedCategory('-dup-src').then((data) => {
        openCreate()
        // ใช้ refNo + slug เดิม แต่ชื่อใหม่
        const dup = { ...buildData('-dup-tgt'), refNo: data.refNo, slug: data.slug }
        fillForm(dup)
        cy.contains('button', 'บันทึก').click()
        cy.wait(2000)
        cy.url().should('include', '/categories/create')
      })
    })
  })

  // ===========================================================
  // 4) EDIT — แก้ฟิลด์ต่างๆ
  // ===========================================================
  describe('แก้ไขหมวดหมู่', () => {
    it('แก้ชื่อภาษาไทย', () => {
      seedCategory('-edit-th').then((data) => {
        openEditFor(data.thaiName)
        const newName = `${data.thaiName}-แก้แล้ว`
        cy.get('input[name="translations.0.name"]').clear().type(newName)
        cy.contains('button', 'บันทึก').click()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
        cy.url().should('match', /\/categories\/?$/, { timeout: 15000 })
        cy.get('input[placeholder="ค้นหา"]').clear().type(newName)
        cy.contains('tbody tr', newName).should('be.visible')
      })
    })

    it('แก้ชื่อภาษาอังกฤษ + คำอธิบาย', () => {
      seedCategory('-edit-en').then((data) => {
        openEditFor(data.thaiName)
        const newEn = `${data.enName} edited`
        const newDesc = 'updated english description'
        cy.get('input[name="translations.1.name"]').clear().type(newEn)
        cy.get('textarea[name="translations.1.description"]').clear().type(newDesc)
        cy.contains('button', 'บันทึก').click()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('แก้ slug', () => {
      seedCategory('-edit-slug').then((data) => {
        openEditFor(data.thaiName)
        const newSlug = `${data.slug}-new`
        cy.get('input[name="slug"]').clear().type(newSlug)
        cy.contains('button', 'บันทึก').click()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('แก้คำอธิบายภาษาไทย', () => {
      seedCategory('-edit-desc').then((data) => {
        openEditFor(data.thaiName)
        const newDesc = 'รายละเอียดที่แก้แล้ว ' + rand()
        cy.get('textarea[name="translations.0.description"]').clear().type(newDesc)
        cy.contains('button', 'บันทึก').click()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('เปลี่ยนสถานะ ฉบับร่าง → เปิดใช้งาน', () => {
      seedCategory('-edit-status').then((data) => {
        openEditFor(data.thaiName)
        cy.get('#mode').click({ force: true })
        cy.contains('กำลังเปิดใช้งาน').should('be.visible')
        cy.contains('button', 'บันทึก').click()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('แก้ไขแล้วยกเลิก (visit list) — ข้อมูลเดิมไม่เปลี่ยน', () => {
      seedCategory('-edit-cancel').then((data) => {
        openEditFor(data.thaiName)
        cy.get('input[name="translations.0.name"]').clear().type('ค่าที่ไม่บันทึก')
        // ไม่กดบันทึก — visit หน้า list แทน
        cy.visit(LIST_URL)
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName).should('be.visible')
      })
    })
  })

  // ===========================================================
  // 5) IMAGE — อัปโหลด / เปลี่ยน
  // ===========================================================
  describe('จัดการรูปภาพ', () => {
    it('แก้ไข: เพิ่มรูปใหม่ทับของเดิม', () => {
      // สร้าง record มีรูปก่อน
      const data = buildData('-img-replace')
      openCreate()
      cy.get('#mode').click({ force: true })
      cy.get('input[accept="image/*"]').selectFile('cypress/fixtures/jib.png', { force: true })
      fillForm(data)
      cy.contains('button', 'บันทึก').click()
      cy.contains('สร้างหมวดหมู่สินค้าสำเร็จแล้ว', { timeout: 15000 }).should('be.visible')

      // เปิด edit แล้วอัปโหลดทับ
      openEditFor(data.thaiName)
      cy.get('input[accept="image/*"]').selectFile('cypress/fixtures/jib.png', { force: true })
      cy.contains('button', 'บันทึก').click()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
    })
  })

  // ===========================================================
  // 6) DELETE
  // ===========================================================
  describe('ลบหมวดหมู่', () => {
    it('เปิดเมนู → ยกเลิกการลบ → ข้อมูลยังอยู่', () => {
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

    it('ยืนยันลบ → record หายจากตาราง', () => {
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
  })

  // ===========================================================
  // 7) SEARCH
  // ===========================================================
  describe('ค้นหา', () => {
    it('ค้นหาตามชื่อภาษาไทย → เจอ', () => {
      seedCategory('-search-th').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName, { timeout: 10000 }).should('be.visible')
      })
    })

    it('ค้นหาตามชื่อภาษาอังกฤษ → search match (มีอย่างน้อย 1 row)', () => {
      seedCategory('-search-en').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.enName)
        // table แสดงเฉพาะชื่อไทย — assert ด้วยจำนวน row ที่ filter แล้ว
        cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
        cy.contains('tbody tr', data.thaiName).should('be.visible')
      })
    })

    it('ค้นหา keyword ที่ไม่มี → ตารางว่าง', () => {
      const fake = `not-exist-${rand()}-${rand()}`
      cy.get('input[placeholder="ค้นหา"]').clear().type(fake)
      cy.wait(1500)
      cy.get('tbody tr').should('have.length.lte', 1) // เผื่อมี empty row state
    })

    it('ล้าง search → กลับมาเห็นข้อมูล', () => {
      seedCategory('-search-clear').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName).should('be.visible')
        cy.get('input[placeholder="ค้นหา"]').clear()
        cy.wait(1000)
        cy.get('tbody tr').its('length').should('be.gte', 1)
      })
    })
  })

  // ===========================================================
  // 8) FILTER ตามสถานะ
  // ===========================================================
  describe('กรองตามสถานะ', () => {
    // หมายเหตุ: ตัว filter Sheet มีแค่ "เปิดใช้งาน" และ "ปิดใช้งาน" (ไม่มี ฉบับร่าง)
    // table ก็ไม่มี column สถานะแบบ text — สถานะแสดงเป็น badge/icon
    // ดังนั้น assert ด้วย URL query param + badge count แทน

    it('กรอง "ปิดใช้งาน" → URL มี status param + table มี row', () => {
      applyStatusFilter('ปิดใช้งาน')
      cy.url().should('include', 'status=')
      cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
      // มี badge "ปิดใช้งาน (...)" แสดงที่หัวฟิลเตอร์
      cy.contains(/ปิดใช้งาน/).should('be.visible')
    })

    it('กรอง "เปิดใช้งาน" → URL มี status param + table มี row', () => {
      applyStatusFilter('เปิดใช้งาน')
      cy.url().should('include', 'status=')
      cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
      cy.contains(/เปิดใช้งาน/).should('be.visible')
    })

    it('กรองหลายสถานะ (multi-select เปิด+ปิด) → URL มี status param', () => {
      applyStatusFilter('เปิดใช้งาน', 'ปิดใช้งาน')
      cy.url().should('include', 'status=')
      cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
    })

    it('ล้างตัวกรองทั้งหมด → กลับมาเห็นข้อมูลปกติ', () => {
      applyStatusFilter('ปิดใช้งาน')
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('ล้างทั้งหมด').click()
      })
      closeSheet()
      cy.get('tbody tr', { timeout: 10000 }).its('length').should('be.gte', 1)
    })
  })

  // ===========================================================
  // 9) SEARCH + FILTER รวมกัน
  // ===========================================================
  describe('Search + Filter รวมกัน', () => {
    it('สร้าง active record แล้ว search + filter เปิดใช้งาน → ต้องเจอ', () => {
      const data = buildData('-combo')
      openCreate()
      cy.get('#mode').click({ force: true })
      fillForm(data)
      cy.contains('button', 'บันทึก').click()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')

      applyStatusFilter('เปิดใช้งาน')
      cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
      cy.contains('tbody tr', data.thaiName, { timeout: 10000 }).should('be.visible')
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
      cy.get('tbody tr', { timeout: 10000 }).its('length').should('be.gte', 1)
      cy.get('tbody tr').its('length').should('be.lte', 20)
    })

    it('เปลี่ยนจำนวนแถว → 50', () => {
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').click()
      cy.contains('[role="option"]', '50').click()
      cy.get('tbody tr', { timeout: 10000 }).its('length').should('be.gte', 1)
      cy.get('tbody tr').its('length').should('be.lte', 50)
    })

    it('เปลี่ยนจำนวนแถว → 100', () => {
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').click()
      cy.contains('[role="option"]', '100').click()
      cy.get('tbody tr', { timeout: 10000 }).its('length').should('be.gte', 1)
      cy.get('tbody tr').its('length').should('be.lte', 100)
    })
  })

  // ===========================================================
  // 11) UI elements
  // ===========================================================
  describe('UI element', () => {
    it('ปุ่ม "เพิ่มหมวดหมู่สินค้า" แสดงและคลิกได้', () => {
      cy.contains('button', 'เพิ่มหมวดหมู่สินค้า').should('be.visible').and('not.be.disabled')
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
  })
})
