const BASE = 'https://backoffice.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/product-manager/brands`
const CREATE_URL = `${LIST_URL}/create`

describe('จัดการแบรนด์สินค้า', () => {

  beforeEach(() => {
    cy.session('jib-admin', () => {
      cy.loginJIB('admin00@email.com', 'password123')
    })
    cy.visit(LIST_URL)
    cy.contains('p', 'แบรนด์สินค้า').should('be.visible')
  })

  // ---------- helpers ----------

  const rand = () => Math.floor(10000 + Math.random() * 90000)

  const buildData = (label = '') => {
    const n = rand()
    return {
      refNo: `JIB-BRAND-${n}${label}`,
      thaiName: `เทสแบรนด์ ${n}${label}`,
      thaiDesc: `รายละเอียดแบรนด์ภาษาไทย ${n}`,
      enName: `Test Brand ${n}${label}`,
      enDesc: `English brand description ${n}`,
    }
  }

  const openCreate = () => {
    cy.contains('button', 'เพิ่มแบรนด์สินค้า').click()
    cy.url().should('include', '/brands/create')
    cy.contains('ข้อมูลแบรนด์สินค้า', { timeout: 10000 }).should('be.visible')
  }

  const fillForm = (data) => {
    if (data.refNo !== undefined) cy.get('input[name="referenceNo"]').clear().type(data.refNo)
    if (data.thaiName !== undefined) cy.get('input[name="translations.0.name"]').clear().type(data.thaiName)
    if (data.thaiDesc !== undefined) cy.get('textarea[name="translations.0.description"]').clear().type(data.thaiDesc)
    if (data.enName !== undefined) cy.get('input[name="translations.1.name"]').clear().type(data.enName)
    if (data.enDesc !== undefined) cy.get('textarea[name="translations.1.description"]').clear().type(data.enDesc)
  }

  const clickSave = () => cy.get('button[type="submit"]').contains('บันทึก').click()

  // สร้าง brand ใหม่ (draft) แล้วคืน data
  const seedBrand = (label = '') => {
    const data = buildData(label)
    openCreate()
    fillForm(data)
    clickSave()
    cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
    cy.url().should('match', /\/brands\/?$/, { timeout: 15000 })
    return cy.wrap(data, { log: false })
  }

  // ค้นหา + เปิด edit
  const openEditFor = (name) => {
    cy.get('input[placeholder="ค้นหา"]').clear().type(name)
    cy.wait(1000) // debounce
    cy.contains('tbody tr', name, { timeout: 10000 })
      .find('a[href*="/brands/update/"]')
      .click()
    cy.url().should('include', '/brands/update/')
    cy.contains('ข้อมูลแบรนด์สินค้า', { timeout: 15000 }).should('be.visible')
  }

  // เปิด filter dialog + ติ๊ก status + กด ตกลง
  const applyStatusFilter = (...statuses) => {
    cy.contains('button', 'ตัวกรอง').click()
    cy.get('[role="dialog"]').within(() => {
      statuses.forEach((s) => cy.contains(s).click())
      cy.contains('button', 'ตกลง').click()
    })
    cy.get('[role="dialog"]').should('not.exist')
  }

  // ===========================================================
  // 1) CREATE — Happy path
  // ===========================================================
  describe('สร้างแบรนด์', () => {
    it('สร้างใหม่ด้วยข้อมูลพื้นฐาน (ฉบับร่าง)', () => {
      seedBrand().then((data) => {
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
      // upload + save อาจช้า — รอ toast นาน + visit list ก็ได้
      cy.contains(/สำเร็จ/, { timeout: 30000 }).should('be.visible')
      cy.visit(LIST_URL)
      cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
      cy.wait(1500)
      cy.contains('tbody tr', data.thaiName).should('contain.text', 'เปิดใช้งาน')
    })

    it('สร้างพร้อมรหัสแบรนด์ + รายละเอียดทั้ง 2 ภาษา', () => {
      const data = buildData('-full')
      openCreate()
      fillForm(data)
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
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

    it('กดบันทึกฟอร์มว่าง → ขึ้น error "กรุณากรอกชื่อ" 2 จุด', () => {
      clickSave()
      cy.contains('กรุณากรอกชื่อ').should('be.visible')
      cy.get('body').contains('กรุณากรอกชื่อ').then(() => {
        // assert 2 error messages (TH + EN required)
        cy.get('body').then(($b) => {
          const count = ($b.text().match(/กรุณากรอกชื่อ/g) || []).length
          expect(count).to.be.at.least(2)
        })
      })
      cy.url().should('include', '/brands/create')
    })

    it('ไม่กรอกชื่อภาษาไทย → ไม่ผ่าน', () => {
      const d = buildData('-noth')
      fillForm({ ...d, thaiName: undefined })
      clickSave()
      cy.contains('กรุณากรอกชื่อ').should('be.visible')
      cy.url().should('include', '/brands/create')
    })

    it('ไม่กรอกชื่อภาษาอังกฤษ → ไม่ผ่าน', () => {
      const d = buildData('-noen')
      fillForm({ ...d, enName: undefined })
      clickSave()
      cy.contains('กรุณากรอกชื่อ').should('be.visible')
      cy.url().should('include', '/brands/create')
    })

    it('รหัสแบรนด์เป็น optional → ไม่กรอกก็บันทึกได้', () => {
      const d = buildData('-noref')
      fillForm({ ...d, refNo: undefined })
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      cy.url().should('match', /\/brands\/?$/)
    })

    it('คำอธิบายเป็น optional → ไม่กรอกก็บันทึกได้', () => {
      const d = buildData('-nodesc')
      fillForm({ ...d, thaiDesc: undefined, enDesc: undefined })
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
    })
  })

  // ===========================================================
  // 3) CREATE — ชื่อซ้ำ (เป็น app behavior ปัจจุบัน — ยอมให้ซ้ำได้)
  // ===========================================================
  describe('ชื่อแบรนด์ซ้ำ (current behavior)', () => {
    it('สร้างชื่อซ้ำ → ระบบยอมรับ (ไม่มี duplicate validation — รายงานทีม)', () => {
      seedBrand('-dup-src').then((data) => {
        openCreate()
        // ใช้ชื่อเดิมทั้ง TH/EN
        fillForm({
          thaiName: data.thaiName,
          enName: data.enName,
        })
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
        cy.url().should('match', /\/brands\/?$/)

        // ตรวจว่าตอนนี้มี ≥ 2 records ที่ชื่อเดียวกัน
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.wait(1500)
        cy.get('tbody tr').filter(`:contains("${data.thaiName}")`).its('length').should('be.gte', 2)
      })
    })
  })

  // ===========================================================
  // 4) EDIT
  // ===========================================================
  describe('แก้ไขแบรนด์', () => {
    it('แก้ชื่อภาษาไทย', () => {
      seedBrand('-edit-th').then((data) => {
        openEditFor(data.thaiName)
        const newName = `${data.thaiName}-แก้`
        cy.get('input[name="translations.0.name"]').clear().type(newName)
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
        cy.url().should('match', /\/brands\/?$/, { timeout: 15000 })
        cy.get('input[placeholder="ค้นหา"]').clear().type(newName)
        cy.contains('tbody tr', newName, { timeout: 10000 }).should('be.visible')
      })
    })

    it('แก้ชื่อภาษาอังกฤษ + คำอธิบาย', () => {
      seedBrand('-edit-en').then((data) => {
        openEditFor(data.thaiName)
        const newEn = `${data.enName} edited`
        cy.get('input[name="translations.1.name"]').clear().type(newEn)
        cy.get('textarea[name="translations.1.description"]').clear().type('updated EN desc')
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('แก้รหัสแบรนด์ (refNo)', () => {
      seedBrand('-edit-ref').then((data) => {
        openEditFor(data.thaiName)
        const newRef = `JIB-EDITED-${rand()}`
        cy.get('input[name="referenceNo"]').clear().type(newRef)
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('เปลี่ยนสถานะ ฉบับร่าง → เปิดใช้งาน', () => {
      seedBrand('-edit-status').then((data) => {
        openEditFor(data.thaiName)
        cy.get('#mode').click({ force: true })
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
        // app อาจไม่ redirect หลังกดบันทึก — visit list เอง
        cy.visit(LIST_URL)
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.wait(1500)
        cy.contains('tbody tr', data.thaiName).should('contain.text', 'เปิดใช้งาน')
      })
    })

    it('แก้แล้วยกเลิก (visit list) → ข้อมูลเดิมไม่เปลี่ยน', () => {
      seedBrand('-edit-cancel').then((data) => {
        openEditFor(data.thaiName)
        cy.get('input[name="translations.0.name"]').clear().type('not-saved-value')
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
    it('เพิ่มรูปใหม่ในตอนแก้ไข', () => {
      seedBrand('-img-add').then((data) => {
        openEditFor(data.thaiName)
        cy.get('input[type="file"]').selectFile('cypress/fixtures/jib.png', { force: true })
        cy.get('img').should('be.visible')
        clickSave()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })

    it('ลบรูปภาพ (มี confirmation dialog)', () => {
      // สร้างพร้อมรูปก่อน
      const data = buildData('-img-del')
      openCreate()
      cy.get('input[type="file"]').selectFile('cypress/fixtures/jib.png', { force: true })
      fillForm(data)
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 30000 }).should('be.visible')

      // เปิด edit → กดลบรูปภาพ → ยืนยันใน dialog
      openEditFor(data.thaiName)
      cy.contains('button', 'ลบรูปภาพ').click()
      cy.contains('คุณต้องการลบภาพนี้ใช่ไหม').should('be.visible')
      cy.get('[role="dialog"]').contains('button', /^ลบ$/).click()
      clickSave()
      cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
    })
  })

  // ===========================================================
  // 6) DELETE
  // ===========================================================
  describe('ลบแบรนด์', () => {
    it('เปิดเมนู → ยกเลิกการลบ → record ยังอยู่', () => {
      seedBrand('-cancel-del').then((data) => {
        openEditFor(data.thaiName)
        cy.get('button[aria-label="Open menu"]').click()
        cy.contains('ลบแบรนด์').click()
        cy.contains('ยืนยันลบแบรนด์นี้ใช่หรือไม่').should('be.visible')
        cy.get('[role="dialog"]').contains('button', 'ยกเลิก').click()
        cy.url().should('include', '/brands/update/')
        cy.get('input[name="translations.0.name"]').should('have.value', data.thaiName)
      })
    })

    it('ยืนยันลบ → หายจากตาราง', () => {
      seedBrand('-del').then((data) => {
        openEditFor(data.thaiName)
        cy.get('button[aria-label="Open menu"]').click()
        cy.contains('ลบแบรนด์').click()
        cy.contains('ยืนยันลบแบรนด์นี้ใช่หรือไม่').should('be.visible')
        cy.get('[role="dialog"]').contains('button', /^ลบ$/).click()
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
        // app อาจไม่ redirect อัตโนมัติหลังลบ — visit list เอง
        cy.visit(LIST_URL)
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.wait(2000)
        cy.contains('tbody tr', data.thaiName).should('not.exist')
      })
    })
  })

  // ===========================================================
  // 7) COPY (คัดลอกแบรนด์)
  // ===========================================================
  describe('คัดลอกแบรนด์', () => {
    it('เปิดเมนู → คัดลอกแบรนด์ → ระบบสร้าง record ใหม่', () => {
      seedBrand('-copy').then((data) => {
        openEditFor(data.thaiName)
        cy.get('button[aria-label="Open menu"]').click()
        cy.contains('คัดลอกแบรนด์').click()
        // คาดว่าระบบสร้าง copy + อาจ redirect ไปหน้า edit ของ copy หรือ list
        cy.contains(/สำเร็จ/, { timeout: 15000 }).should('be.visible')
      })
    })
  })

  // ===========================================================
  // 8) SEARCH
  // ===========================================================
  describe('ค้นหา', () => {
    it('ค้นหาตามชื่อภาษาไทย → เจอ', () => {
      seedBrand('-search-th').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName, { timeout: 10000 }).should('be.visible')
      })
    })

    it('ค้นหาตามชื่อภาษาอังกฤษ → URL มี search param + table มี row', () => {
      seedBrand('-search-en').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.enName)
        cy.url({ timeout: 5000 }).should('include', 'search=')
        cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
      })
    })

    it('ค้นหาตาม refNo → URL อัปเดต', () => {
      seedBrand('-search-ref').then((data) => {
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
      seedBrand('-search-clear').then((data) => {
        cy.get('input[placeholder="ค้นหา"]').clear().type(data.thaiName)
        cy.contains('tbody tr', data.thaiName).should('be.visible')
        cy.get('input[placeholder="ค้นหา"]').clear()
        cy.wait(1000)
        cy.get('tbody tr').its('length').should('be.gte', 1)
      })
    })
  })

  // ===========================================================
  // 9) FILTER (Sheet "สถานะ" — มีปุ่ม ตกลง/ยกเลิก)
  // ===========================================================
  describe('กรองตามสถานะ', () => {
    it('กรอง "เปิดใช้งาน" → URL มี status param', () => {
      applyStatusFilter('เปิดใช้งาน')
      cy.url().should('include', 'status=')
      cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
    })

    it('กรอง "ปิดใช้งาน" → URL มี status param', () => {
      applyStatusFilter('ปิดใช้งาน')
      cy.url().should('include', 'status=')
    })

    it('กรองหลายสถานะ (multi-select) → URL มี status param', () => {
      applyStatusFilter('เปิดใช้งาน', 'ปิดใช้งาน')
      cy.url().should('include', 'status=')
      cy.get('tbody tr', { timeout: 10000 }).should('have.length.gte', 1)
    })

    it('เปิด filter → กดยกเลิก → ไม่ apply', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('เปิดใช้งาน').click()
        cy.contains('button', 'ยกเลิก').click()
      })
      cy.get('[role="dialog"]').should('not.exist')
      // ไม่ apply → URL ไม่ควรมี status param ใหม่
    })
  })

  // ===========================================================
  // 10) CUSTOMIZE COLUMNS (ปรับแต่งคอลัมน์)
  // ===========================================================
  describe('ปรับแต่งคอลัมน์', () => {
    it('เปิด menu ปรับแต่งคอลัมน์ → แสดงทุก option', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.get('[role="menuitemcheckbox"]').should('have.length.at.least', 5)
      cy.contains('[role="menuitemcheckbox"]', 'แบรนด์สินค้า').should('be.visible')
      cy.get('body').type('{esc}')
    })

    it('ซ่อนคอลัมน์ "SKU" → header หายจากตาราง', () => {
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.contains('[role="menuitemcheckbox"]', 'SKU').click()
      cy.get('body').type('{esc}')
      cy.get('thead').should('not.contain.text', 'SKU')
    })

    it('เปิดคอลัมน์กลับมา → header แสดงอีกครั้ง', () => {
      // toggle off
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.contains('[role="menuitemcheckbox"]', 'SKU').click()
      cy.get('body').type('{esc}')
      // toggle on
      cy.contains('button', 'ปรับแต่งคอลัมน์').click()
      cy.contains('[role="menuitemcheckbox"]', 'SKU').click()
      cy.get('body').type('{esc}')
      cy.get('thead').should('contain.text', 'SKU')
    })
  })

  // ===========================================================
  // 11) SORT
  // ===========================================================
  describe('Sort คอลัมน์', () => {
    it('คลิก header "แบรนด์สินค้า" → table ยัง render', () => {
      cy.contains('thead button', 'แบรนด์สินค้า').click()
      cy.wait(800)
      cy.get('tbody tr').its('length').should('be.gte', 1)
    })

    it('คลิก header "#" → table ยัง render', () => {
      cy.contains('thead button', /^#$/).click()
      cy.wait(800)
      cy.get('tbody tr').its('length').should('be.gte', 1)
    })
  })

  // ===========================================================
  // 12) PAGINATION
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

    it('เปลี่ยนจำนวนแถว → 100', () => {
      cy.contains('p', 'จำนวนแถว').parent().find('[role="combobox"]').click()
      cy.contains('[role="option"]', '100').click()
      cy.get('tbody tr', { timeout: 10000 }).its('length').should('be.lte', 100)
    })

    it('กดไปหน้า 2', () => {
      cy.contains('nav[aria-label="pagination"] a, [role="navigation"] a', '2').click()
      cy.wait(1000)
      cy.get('tbody tr').its('length').should('be.gte', 1)
    })
  })

  // ===========================================================
  // 13) BULK SELECTION (checkbox ในตาราง)
  // ===========================================================
  describe('เลือกแบบ Bulk', () => {
    it('ติ๊ก checkbox ใน row แรก → เลือกแถวได้', () => {
      cy.get('tbody tr:first-child button[role="checkbox"]').click({ force: true })
      cy.get('tbody tr:first-child button[role="checkbox"]').should('have.attr', 'data-state', 'checked')
    })

    it('ติ๊ก checkbox header → เลือกทุก row บนหน้า', () => {
      cy.get('thead button[role="checkbox"]').click({ force: true })
      cy.get('tbody button[role="checkbox"][data-state="checked"]').its('length').should('be.gte', 1)
    })
  })

  // ===========================================================
  // 14) UI elements
  // ===========================================================
  describe('UI element', () => {
    it('ปุ่ม "เพิ่มแบรนด์สินค้า" แสดงและคลิกได้', () => {
      cy.contains('button', 'เพิ่มแบรนด์สินค้า').should('be.visible').and('not.be.disabled')
    })

    it('ช่องค้นหาแสดงและพิมพ์ได้', () => {
      cy.get('input[placeholder="ค้นหา"]').should('be.visible').type('hello')
        .should('have.value', 'hello')
    })

    it('ปุ่ม "ตัวกรอง" เปิด filter dialog ได้', () => {
      cy.contains('button', 'ตัวกรอง').click()
      cy.get('[role="dialog"]').should('be.visible')
      cy.get('[role="dialog"]').contains('button', 'ยกเลิก').click()
    })

    it('breadcrumb แสดง "แบรนด์สินค้า"', () => {
      cy.get('nav[aria-label="breadcrumb"]').should('contain.text', 'แบรนด์สินค้า')
    })

    it('ตารางมีคอลัมน์ "แบรนด์สินค้า" และ "สถานะ"', () => {
      cy.get('thead').should('contain.text', 'แบรนด์สินค้า')
      cy.get('thead').should('contain.text', 'สถานะ')
    })
  })
})
