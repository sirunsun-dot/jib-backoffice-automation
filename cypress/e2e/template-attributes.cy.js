const BASE = 'https://backoffice.jibc.codelabdev.co'
const LIST_URL = `${BASE}/store/product-manager/template-attributes`
const CREATE_URL = `${LIST_URL}/create`

describe('จัดการเทมเพลตคุณสมบัติ', () => {

  beforeEach(() => {
    cy.session('jib-admin', () => {
      cy.loginJIB('admin00@email.com', 'password123')
    })
  })

  // ---------- helpers ----------

  const rand = () => Math.floor(10000 + Math.random() * 90000)

  // เลือก option จาก Radix Select ตาม trigger index (0 = หมวดหมู่หลัก, 1 = หมวดหมู่ย่อย, ...)
  const pickSelect = (triggerIndex, optionMatcher) => {
    cy.get('button[data-slot="select-trigger"]').eq(triggerIndex).click()
    if (optionMatcher === undefined) {
      cy.get('[role="option"]').first().click()
    } else if (optionMatcher instanceof RegExp) {
      cy.contains('[role="option"]', optionMatcher).click()
    } else {
      cy.contains('[role="option"]', optionMatcher).click()
    }
  }

  // เลือกหมวดหมู่หลัก + ย่อย (ใช้ option แรกของแต่ละตัว)
  const selectCategoryPair = () => {
    pickSelect(0)
    cy.get('button[data-slot="select-trigger"]').eq(1).should('not.be.disabled')
    pickSelect(1)
  }

  // กรอกข้อมูลพื้นฐานของเทมเพลต
  const fillBasic = (name, description) => {
    cy.get('input[name="name"]').clear().type(name)
    if (description) cy.get('textarea[name="description"]').clear().type(description)
  }

  // เปิดฟอร์มสร้างใหม่จาก list
  const openCreateForm = () => {
    cy.visit(LIST_URL)
    cy.contains('button', 'เพิ่มเทมเพลต').click()
    cy.url().should('include', '/template-attributes/create')
    cy.contains('ข้อมูลพื้นฐาน').should('be.visible')
  }

  // สลับ tab
  const switchToDisplay = () => cy.contains('button', /^การแสดงผล$/).click()
  const switchToMapping = () => cy.contains('button', /^Mapping$/).click()

  // กดปุ่ม "บันทึก" บนหัวฟอร์ม (ปุ่มเดียวที่มี text นี้)
  const clickSave = () => cy.contains('button', 'บันทึก').click()

  // รอ toast แจ้งสำเร็จ
  const expectSuccess = () => {
    cy.contains(/สร้าง.*สำเร็จ|บันทึก.*สำเร็จ|สำเร็จ/, { timeout: 15000 }).should('be.visible')
  }

  // ===========================================================
  // 1) ข้อมูลพื้นฐาน + UI behavior
  // ===========================================================
  describe('ข้อมูลพื้นฐาน + UI behavior', () => {
    beforeEach(() => {
      openCreateForm()
    })

    it('สร้างเทมเพลตด้วยข้อมูลพื้นฐาน (ฉบับร่าง) - ไม่มีคุณสมบัติ', () => {
      const n = rand()
      selectCategoryPair()
      fillBasic(`เทสเทมเพลต ${n}`, 'รายละเอียดทดสอบอัตโนมัติ')
      clickSave()
      expectSuccess()
      cy.url({ timeout: 15000 }).should('include', LIST_URL)
    })

    it('หมวดหมู่ย่อยต้อง disabled จนกว่าจะเลือกหมวดหมู่หลัก', () => {
      cy.get('button[data-slot="select-trigger"]').eq(1).should('be.disabled')
      pickSelect(0)
      cy.get('button[data-slot="select-trigger"]').eq(1).should('not.be.disabled')
    })

    it('character counter แสดง 0/50 และอัปเดตขณะพิมพ์', () => {
      cy.contains('p', '0/50').should('be.visible')
      cy.get('input[name="name"]').type('hello')
      cy.contains('p', '5/50').should('be.visible')
    })

    it('ชื่อเทมเพลตจำกัด 50 ตัวอักษร (พิมพ์ครบ 50 + counter ขึ้น 50/50)', () => {
      const exact50 = 'a'.repeat(50)
      cy.get('input[name="name"]').type(exact50)
      cy.get('input[name="name"]').invoke('val').should('have.length', 50)
      cy.contains('p', '50/50').should('be.visible')
    })

    it('Validation: บันทึกโดยไม่กรอก required → ยังอยู่หน้า create', () => {
      clickSave()
      cy.wait(1500)
      cy.url().should('include', '/create')
    })

    it('Toggle "ฉบับร่าง" สลับสถานะได้', () => {
      cy.contains('ฉบับร่าง').should('be.visible')
      cy.get('#mode').click({ force: true })
      // หลังกดควรเปลี่ยน label
      cy.contains(/ฉบับร่าง|กำลังเปิดใช้งาน/).should('be.visible')
    })
  })

  // ===========================================================
  // 2) คุณสมบัติแบบ "การแสดงผล" (มีชื่อ TH + EN)
  // ===========================================================
  describe('คุณสมบัติ "การแสดงผล"', () => {
    beforeEach(() => {
      openCreateForm()
      selectCategoryPair()
      switchToDisplay()
    })

    it('สร้างเทมเพลต + 1 หัวข้อ + 1 รายการ ในการแสดงผล', () => {
      const n = rand()
      fillBasic(`เทสแสดงผล ${n}`)

      cy.contains('button', 'เพิ่มคุณสมบัติ').click()
      cy.get('input[name="displayTopics.0.nameTh"]').type('หัวข้อภาษาไทย')
      cy.get('input[name="displayTopics.0.nameEn"]').type('Header EN')

      cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click()
      cy.get('input[name="displayTopics.0.items.0.nameTh"]').type('รายการภาษาไทย')
      cy.get('input[name="displayTopics.0.items.0.nameEn"]').type('Item EN')

      clickSave()
      expectSuccess()
    })

    it('เพิ่ม 2 หัวข้อ + รายการในแต่ละหัวข้อ', () => {
      const n = rand()
      fillBasic(`เทส 2 หัวข้อ ${n}`)

      // หัวข้อ 1 + เพิ่ม item (มีปุ่ม "เพิ่มรายการคุณสมบัติ" แค่ปุ่มเดียว)
      cy.contains('button', 'เพิ่มคุณสมบัติ').click()
      cy.get('input[name="displayTopics.0.nameTh"]').type('หัวข้อ 1 TH')
      cy.get('input[name="displayTopics.0.nameEn"]').type('Topic 1 EN')
      cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click()
      cy.get('input[name="displayTopics.0.items.0.nameTh"]').type('A1 TH')
      cy.get('input[name="displayTopics.0.items.0.nameEn"]').type('A1 EN')

      // หัวข้อ 2 — Radix Accordion จะ auto-collapse หัวข้อก่อนหน้า/หัวข้อใหม่
      // ใช้ input ของหัวข้อ 2 หา container เพื่อ scope การคลิกปุ่ม
      cy.contains('button', 'เพิ่มหัวข้อคุณสมบัติ').click()
      cy.get('input[name="displayTopics.1.nameTh"]', { timeout: 8000 }).type('หัวข้อ 2 TH')
      cy.get('input[name="displayTopics.1.nameEn"]').type('Topic 2 EN')

      // เพิ่ม item ในหัวข้อ 2 — scope ผ่าน input ของหัวข้อ 2 เพื่อหา panel ที่ถูกต้อง
      cy.get('input[name="displayTopics.1.nameEn"]')
        .parents('div')
        .filter(':has(button:contains("เพิ่มรายการคุณสมบัติ"))')
        .first()
        .within(() => {
          cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click({ force: true })
        })
      cy.get('input[name="displayTopics.1.items.0.nameTh"]', { timeout: 8000 }).type('B1 TH')
      cy.get('input[name="displayTopics.1.items.0.nameEn"]').type('B1 EN')

      clickSave()
      expectSuccess()
    })

    it('เพิ่มหลายรายการในหัวข้อเดียว (3 รายการ)', () => {
      const n = rand()
      fillBasic(`เทสหลายรายการ ${n}`)

      cy.contains('button', 'เพิ่มคุณสมบัติ').click()
      cy.get('input[name="displayTopics.0.nameTh"]').type('Specs TH')
      cy.get('input[name="displayTopics.0.nameEn"]').type('Specs EN')

      // เพิ่ม 3 รายการ
      ;[0, 1, 2].forEach((i) => {
        cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click()
        cy.get(`input[name="displayTopics.0.items.${i}.nameTh"]`).type(`รายการ ${i + 1}`)
        cy.get(`input[name="displayTopics.0.items.${i}.nameEn"]`).type(`Item ${i + 1}`)
      })

      clickSave()
      expectSuccess()
    })

    it('เปิด switch "จำเป็นต้องกรอก" ในรายการ', () => {
      const n = rand()
      fillBasic(`เทส required ${n}`)

      cy.contains('button', 'เพิ่มคุณสมบัติ').click()
      cy.get('input[name="displayTopics.0.nameTh"]').type('Required TH')
      cy.get('input[name="displayTopics.0.nameEn"]').type('Required EN')

      cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click()
      cy.get('input[name="displayTopics.0.items.0.nameTh"]').type('item TH')
      cy.get('input[name="displayTopics.0.items.0.nameEn"]').type('item EN')

      // toggle "จำเป็นต้องกรอก"
      cy.contains('p', 'จำเป็นต้องกรอก').parent().find('button[role="switch"]').click({ force: true })

      clickSave()
      expectSuccess()
    })
  })

  // ===========================================================
  // 3) คุณสมบัติแบบ "Mapping" (ผูกกับกลุ่มตัวเลือก)
  // ===========================================================
  describe('คุณสมบัติ "Mapping"', () => {
    beforeEach(() => {
      openCreateForm()
      selectCategoryPair()
      switchToMapping()
    })

    it('สร้างเทมเพลต + 1 หัวข้อ + 1 รายการ Mapping (ผูกกลุ่มตัวเลือก)', () => {
      const n = rand()
      fillBasic(`เทส Mapping ${n}`)

      cy.contains('button', 'เพิ่มคุณสมบัติ').click()
      cy.get('input[name="templateMapping.0.name"]').type('Mapping Header')

      cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click()
      // เลือก combobox "เลือกกลุ่มตัวเลือก" — น่าจะเป็น trigger สุดท้ายที่ visible
      cy.contains('button[data-slot="select-trigger"]', 'เลือกกลุ่มตัวเลือก').click()
      cy.get('[role="option"]').first().click()

      clickSave()
      expectSuccess()
    })

    it('เพิ่ม 2 หัวข้อใน Mapping', () => {
      const n = rand()
      fillBasic(`เทส Map 2 หัวข้อ ${n}`)

      cy.contains('button', 'เพิ่มคุณสมบัติ').click()
      cy.get('input[name="templateMapping.0.name"]').type('Mapping 1')

      cy.contains('button', 'เพิ่มหัวข้อคุณสมบัติ').click()
      cy.get('input[name="templateMapping.1.name"]').type('Mapping 2')

      // เพิ่ม item ในหัวข้อแรก
      cy.get('button').contains('เพิ่มรายการคุณสมบัติ').first().click()
      cy.contains('button[data-slot="select-trigger"]', 'เลือกกลุ่มตัวเลือก').first().click()
      cy.get('[role="option"]').first().click()

      clickSave()
      expectSuccess()
    })

    it('เปิด switch "จำเป็นต้องกรอก" ใน Mapping item', () => {
      const n = rand()
      fillBasic(`เทส Map required ${n}`)

      cy.contains('button', 'เพิ่มคุณสมบัติ').click()
      cy.get('input[name="templateMapping.0.name"]').type('Map req')

      cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click()
      cy.contains('button[data-slot="select-trigger"]', 'เลือกกลุ่มตัวเลือก').click()
      cy.get('[role="option"]').first().click()

      cy.contains('p', 'จำเป็นต้องกรอก').parent().find('button[role="switch"]').click({ force: true })

      clickSave()
      expectSuccess()
    })
  })

  // ===========================================================
  // 4) Full flow: ข้อมูลพื้นฐาน + การแสดงผล + Mapping
  // ===========================================================
  describe('Full flow: รวมทุก section', () => {
    it('สร้างเทมเพลตเต็มรูปแบบ (พื้นฐาน + การแสดงผล + Mapping)', () => {
      const n = rand()
      openCreateForm()
      selectCategoryPair()
      fillBasic(`เทสครบทุก section ${n}`, 'คำอธิบายของเทมเพลตเต็มรูปแบบ')

      // การแสดงผล
      switchToDisplay()
      cy.contains('button', 'เพิ่มคุณสมบัติ').click()
      cy.get('input[name="displayTopics.0.nameTh"]').type('สเปคหลัก TH')
      cy.get('input[name="displayTopics.0.nameEn"]').type('Main Specs EN')
      cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click()
      cy.get('input[name="displayTopics.0.items.0.nameTh"]').type('สี')
      cy.get('input[name="displayTopics.0.items.0.nameEn"]').type('Color')
      cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click()
      cy.get('input[name="displayTopics.0.items.1.nameTh"]').type('ขนาด')
      cy.get('input[name="displayTopics.0.items.1.nameEn"]').type('Size')

      // Mapping
      switchToMapping()
      cy.contains('button', 'เพิ่มคุณสมบัติ').click()
      cy.get('input[name="templateMapping.0.name"]').type('Filter Map')
      cy.contains('button', 'เพิ่มรายการคุณสมบัติ').click()
      cy.contains('button[data-slot="select-trigger"]', 'เลือกกลุ่มตัวเลือก').click()
      cy.get('[role="option"]').first().click()

      clickSave()
      expectSuccess()
      cy.url({ timeout: 15000 }).should('include', LIST_URL)
    })

    it('สร้างเทมเพลต + เปิดใช้งานทันที (toggle off ฉบับร่าง)', () => {
      const n = rand()
      openCreateForm()
      cy.get('#mode').click({ force: true })
      selectCategoryPair()
      fillBasic(`เทสเปิดใช้งาน ${n}`)
      clickSave()
      expectSuccess()
    })
  })

  // ===========================================================
  // 5) Tab navigation
  // ===========================================================
  describe('Tab navigation', () => {
    beforeEach(() => {
      openCreateForm()
    })

    it('สลับ tab "การแสดงผล" ↔ "Mapping" ได้ + ข้อมูลพื้นฐานคงอยู่', () => {
      cy.get('input[name="name"]').type('persist test')
      switchToMapping()
      cy.contains('ยังไม่มีคุณสมบัติสำหรับ "Mapping"').should('be.visible')
      switchToDisplay()
      cy.contains('ยังไม่มีคุณสมบัติสำหรับ "การแสดงผล"').should('be.visible')
      cy.get('input[name="name"]').should('have.value', 'persist test')
    })
  })
})
