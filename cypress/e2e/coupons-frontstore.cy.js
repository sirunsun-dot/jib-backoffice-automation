/**
 * E2E คูปอง: สร้างครบทุกเงื่อนไขใน Back Office → ตรวจหน้า Front Store ว่าแสดงถูกต้อง
 *
 * แกนเงื่อนไขที่ครอบ:
 *  - รูปแบบส่วนลด (discountTarget): product / shipping / cart  → 3 section บนหน้าร้าน
 *  - ประเภทส่วนลด: percent (มี "ส่วนลดสูงสุด") / amount (ไม่มี cap)
 *  - การแสดงผลสาธารณะ (showOnPublicList): เปิด = ขึ้นหน้าร้าน / ปิด = ซ่อน
 *  - รูปแบบรหัส: รหัสเดียว / สร้างรหัสอัตโนมัติ
 *
 * mapping ที่ยืนยันแล้ว (BE field discountTarget → section หน้าร้าน):
 *   product  → "โค้ดส่วนลดร้านค้า"
 *   shipping → "โค้ดส่วนลดส่งฟรี"  (section นี้โผล่เฉพาะเมื่อมีคูปอง shipping ที่ public)
 *   cart     → "ส่วนลดท้ายบิล"
 */

const ADMIN = 'https://devstorex.jibc.codelabdev.co'
const STORE = 'https://storedev.jibc.codelabdev.co'
const LIST_URL = `${ADMIN}/store/promotion-manager/coupons`
// API สาธารณะ (live ไม่ผ่าน SSR cache) ใช้ยืนยัน target / การแสดงผล ได้แม่นกว่าการอ่าน DOM
const PUBLIC_API = 'https://jib-dev-be-main.fqykqy.easypanel.host/coupon/public'

const dlg = () => cy.get('[role="dialog"][data-state="open"]')

// Front Store คนละ origin กับ Back Office — ต้อง wrap DOM commands ด้วย cy.origin
const onStoreCoupons = (args, fn) => {
  cy.visit(`${STORE}/th/coupons`)
  cy.origin(STORE, { args }, fn)
}

// set ค่าให้ input ตัวเลขแบบ React-safe (ใช้ native setter + ยิง input event)
// เพราะ .clear()/.type() กับ number input ตัวนี้ลบค่า default "0" ไม่ออก → ได้ "150" แทน "15"
const setNumber = (name, val) => {
  dlg().find(`input[name="${name}"]`).then(($el) => {
    const input = $el[0]
    const proto = input.ownerDocument.defaultView.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, String(val))
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  dlg().find(`input[name="${name}"]`).should('have.value', String(val))
}

describe('คูปอง E2E: Back Office → Front Store', () => {
  // โค้ด/ชื่อ unique ต่อรอบรัน เพื่อค้นหาได้แน่นอน
  const stamp = Date.now().toString().slice(-6)
  const campaignName = `QA คูปองหน้าร้าน ${stamp}`
  const items = {
    product: { name: `สินค้า% ${stamp}`, code: `QAPROD${stamp}` },
    shipping: { name: `ค่าส่ง฿ ${stamp}`, code: `QASHIP${stamp}` },
    cart: { name: `ท้ายบิล฿ ${stamp}`, code: `QACART${stamp}` },
    hidden: { name: `ซ่อน ${stamp}`, code: `QAHIDE${stamp}` },
  }

  beforeEach(() => {
    cy.viewport(1920, 1080)
    // restore session ทุก test (สำคัญหลัง cy.origin ของ Front Store) แล้ว reset origin กลับ Back Office
    cy.session('jib-admin', () => {
      cy.loginJIB('sirun.sun@codelabdev.co', 'test123')
    })
    cy.visit(LIST_URL)
    cy.contains('p', 'คูปอง', { timeout: 15000 }).should('be.visible')
  })

  // ---------- helpers (Back Office) ----------

  const openCreate = () => {
    cy.visit(`${ADMIN}/store/promotion-manager/coupons/create`)
    cy.contains('p', 'เพิ่มแคมเปญคูปอง', { timeout: 15000 }).should('be.visible')
  }

  // ตั้ง active period = วันนี้ → วันนี้+~14 วัน (ต้องครอบ "วันนี้" คูปองถึงจะขึ้นหน้าร้าน)
  // ปฏิทินเป็น react-day-picker (range) — คลิกวันเริ่มแล้ว grid re-render → ต้อง re-query ก่อนคลิกวันสิ้นสุด
  const setActivePeriod = () => {
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (เขต UTC ของ env ตรงกับวันที่ระบบ)
    cy.contains('label', 'ระบุระยะเวลา').click()
    cy.get('button:contains("ระบุวันที่เริ่ม")').first().click()
    // วันเริ่ม = "วันนี้"
    cy.get('[role="dialog"] [role="gridcell"] button[aria-label*="วันนี้"]', { timeout: 8000 }).click()
    // วันสิ้นสุด = re-query (เลี่ยง stale ref หลัง re-render) แล้วเลือก cell ห่างจากวันนี้ ~14 วัน
    cy.get('[role="dialog"] [role="gridcell"] button:not([disabled])')
      .should('have.length.gte', 20)
      .then(($cells) => {
        const arr = [...$cells]
        const tIdx = arr.findIndex((b) => /วันนี้/.test(b.getAttribute('aria-label') || ''))
        const endIdx = Math.min((tIdx >= 0 ? tIdx : 0) + 14, arr.length - 1)
        cy.wrap(arr[endIdx]).click()
      })
    cy.contains('button', 'ใช้งาน').click()
    // ยืนยันว่าช่วงวันเริ่ม = วันนี้จริง (กันเคสปฏิทิน collapse เป็นวันอนาคตวันเดียว → คูปองไม่ active)
    cy.get('button:contains("เริ่มต้น")').first().should('contain.text', today)
  }

  /**
   * เพิ่ม 1 รายการคูปองผ่าน dialog
   * @param {object} o
   * @param {'product'|'shipping'|'cart'} o.target รูปแบบส่วนลด
   * @param {'percent'|'amount'} o.type ประเภทส่วนลด
   * @param {number} o.value มูลค่าส่วนลด
   * @param {number} [o.max] ส่วนลดสูงสุด (เฉพาะ percent)
   * @param {number} [o.min] ยอดซื้อขั้นต่ำ
   * @param {boolean} o.isPublic แสดงในรายการสาธารณะ
   */
  const addItem = (o) => {
    cy.contains('button', 'เพิ่มรายการคูปอง').click()
    dlg().should('be.visible')

    dlg().find('input[name="translations.0.name"]').clear().type(o.name)

    // รูปแบบส่วนลด (Radix select — option render นอก dialog)
    if (o.target !== 'cart') {
      dlg().find('button[role="combobox"]').first().click()
      const label = o.target === 'product' ? 'ส่วนลดค่าสินค้า' : 'ส่วนลดค่าจัดส่ง'
      cy.get('[role="option"]').contains(label).click()
    }

    // ประเภทส่วนลด
    if (o.type === 'amount') {
      dlg().contains('label', 'จำนวนเงิน (บาท)').click()
    }

    // วิธีจัดส่ง (เฉพาะ shipping — required; default = จัดส่งปกติ checked อยู่แล้ว)
    // อย่าคลิก label ตรงๆ เพราะจะ toggle ปิด → save แล้ว error "กรุณาเลือกวิธีการจัดส่ง"
    if (o.target === 'shipping') {
      dlg()
        .contains('label', 'จัดส่งปกติ')
        .find('button[role="checkbox"]')
        .should('have.attr', 'data-state', 'checked')
    }

    // การแสดงผลสาธารณะ — default OFF ต้องเปิดเองถ้าจะให้ขึ้นหน้าร้าน
    // ต้องสลับ "ก่อน" กรอกตัวเลข เพราะ toggle ทำให้ฟอร์ม re-render แล้วล้างค่ามูลค่าส่วนลด
    if (o.isPublic) {
      dlg()
        .contains('การแสดงผลในรายการสาธารณะ')
        .parent()
        .find('button[role="switch"]')
        .click()
        .should('have.attr', 'data-state', 'checked')
    }

    // กรอกตัวเลขท้ายสุด (React-safe) + assert ว่าค่าติดจริง
    setNumber('discountValue', o.value)
    if (o.max != null) setNumber('maxDiscount', o.max)
    if (o.min != null) setNumber('minPurchaseAmount', o.min)

    dlg().find('input[name="code"]').clear().type(o.code)
    dlg().contains('button', 'ยืนยัน').click()

    dlg().should('not.exist')
    cy.contains('tbody tr', o.code).should('be.visible')
  }

  // กดบันทึก แล้วกดยืนยันถ้ามี dialog ยืนยัน (รอ render ก่อนเช็ค)
  const saveCampaign = () => {
    // guard ก่อน save: ชื่อแคมเปญต้องยังอยู่ (กันเคสฟิลด์ถูกล้าง → save ค้างเงียบๆ)
    cy.get('input[name="translations.0.name"]').first().invoke('val').should('not.be.empty')
    cy.contains('button', 'บันทึก').click()
    cy.wait(1500)
    cy.get('body').then(($b) => {
      if ($b.find('button:contains("ยืนยันบันทึก")').length) {
        cy.contains('button', 'ยืนยันบันทึก').click()
        cy.wait(1500)
      }
    })
    cy.url().then((u) => {
      if (/\/create/.test(u)) {
        // เก็บข้อความ validation ทั้งหมด (inline error ใต้ฟิลด์ + toast) เพื่อบอกสาเหตุชัด
        cy.get('body').then(($b) => {
          const msgs = []
          $b.find('[role="alert"], .text-destructive, [data-sonner-toast], [role="status"], p, span').each((_, el) => {
            const t = (el.innerText || '').trim()
            if (/กรุณา|จำเป็น|ผิดพลาด|ไม่สำเร็จ|ต้อง|invalid|required/i.test(t) && t.length < 120) msgs.push(t)
          })
          throw new Error('Save ค้างหน้า create. Validation: ' + ([...new Set(msgs)].join(' | ') || '(ไม่พบข้อความ)'))
        })
      }
    })
    cy.url({ timeout: 20000 }).should('match', /\/coupons\/?$/)
  }

  // ---------- 1) สร้างแคมเปญครบทุกเงื่อนไข + verify หน้าร้าน ----------

  it('สร้างคูปอง 3 รูปแบบ (product/shipping/cart) + 1 ซ่อน แล้วตรวจหน้า Front Store', () => {
    openCreate()

    cy.get('input[name="translations.0.name"]').type(campaignName)
    setActivePeriod()

    // product + percent (มี max cap) + public
    addItem({ ...items.product, target: 'product', type: 'percent', value: 15, max: 300, min: 1000, isPublic: true })
    // shipping + amount + public
    addItem({ ...items.shipping, target: 'shipping', type: 'amount', value: 50, isPublic: true })
    // cart + amount + public
    addItem({ ...items.cart, target: 'cart', type: 'amount', value: 200, min: 2000, isPublic: true })
    // cart + percent + ซ่อน (showOnPublicList=false)
    addItem({ ...items.hidden, target: 'cart', type: 'percent', value: 5, isPublic: false })

    cy.contains('tbody tr', items.product.code).should('be.visible')
    cy.contains('tbody tr', items.hidden.code).should('be.visible')
    cy.get('tbody tr').should('have.length', 4) // ครบ 4 รายการก่อนบันทึก

    saveCampaign()

    // ----- ยืนยันผ่าน Public API (เชื่อถือได้ ไม่โดน SSR cache) -----
    cy.request(PUBLIC_API).then((res) => {
      expect(res.status).to.eq(200)
      const camp = res.body.data.find((c) => c.name === campaignName)
      expect(camp, 'แคมเปญต้องอยู่ใน public feed').to.exist
      const cond = (code) => camp.conditions.find((x) => x.code === code)

      expect(cond(items.product.code).discountTarget, 'product target').to.eq('product')
      expect(cond(items.product.code).showOnPublicList).to.be.true
      expect(cond(items.product.code).discountType).to.eq('percent')
      expect(cond(items.product.code).maxDiscount).to.eq(300)

      expect(cond(items.shipping.code).discountTarget, 'shipping target').to.eq('shipping')
      expect(cond(items.shipping.code).showOnPublicList).to.be.true

      expect(cond(items.cart.code).discountTarget, 'cart target').to.eq('cart')
      expect(cond(items.cart.code).showOnPublicList).to.be.true

      expect(cond(items.hidden.code).showOnPublicList, 'รายการซ่อน ต้อง showOnPublicList=false').to.be.false
    })

    // ----- ยืนยันการ render หน้า Front Store -----
    onStoreCoupons(
      {
        productName: items.product.name,
        shippingName: items.shipping.name,
        cartName: items.cart.name,
        hiddenName: items.hidden.name,
        hiddenCode: items.hidden.code,
      },
      ({ productName, shippingName, cartName, hiddenName, hiddenCode }) => {
        cy.contains('h2', 'โค้ดส่วนลดร้านค้า', { timeout: 20000 }).should('be.visible')
        cy.contains('h2', 'โค้ดส่วนลดส่งฟรี').should('be.visible')
        cy.contains('h2', 'ส่วนลดท้ายบิล').should('be.visible')

        cy.contains(productName).should('be.visible')
        cy.contains(shippingName).should('be.visible')
        cy.contains(cartName).should('be.visible')
        cy.contains('ขั้นต่ำ ฿1,000 · สูงสุด ฿300').should('be.visible')

        cy.contains(hiddenName).should('not.exist')
        cy.contains(hiddenCode).should('not.exist')
      },
    )
  })

  // ---------- 2) ปุ่ม "เงื่อนไข" บนหน้าร้าน ----------

  it('กดปุ่ม "เงื่อนไข" ของคูปอง product → modal โชว์รายละเอียดครบ', () => {
    onStoreCoupons(
      { productName: items.product.name, productCode: items.product.code },
      ({ productName, productCode }) => {
        cy.contains(productName, { timeout: 20000 }).should('be.visible')

        // คลิกปุ่ม "เงื่อนไข" ภายในการ์ดที่มีชื่อคูปอง product
        cy.contains('p', productName).then(($p) => {
          const card = $p.parents().toArray().find((el) =>
            [...el.querySelectorAll('button')].some((b) => b.innerText.trim() === 'เงื่อนไข'),
          )
          cy.wrap(card).contains('button', 'เงื่อนไข').click()
        })

        cy.get('[role="dialog"]').within(() => {
          cy.contains(productCode).should('be.visible')
          cy.contains('ยอดสั่งซื้อขั้นต่ำ ฿1,000').should('be.visible')
          cy.contains('รับส่วนลดสูงสุด ฿300').should('be.visible')
          cy.contains(/สิทธิ์ต่อบัญชี/).should('be.visible')
          cy.contains(/ใช้ได้.*น\./).should('be.visible')
        })
      },
    )
  })

  // ---------- 3) Back Office: รูปแบบรหัสอัตโนมัติ ----------

  it('รายการคูปองแบบ "สร้างรหัสอัตโนมัติ" → ฟิลด์ครบและเพิ่มเข้าตารางได้', () => {
    openCreate()
    cy.get('input[name="translations.0.name"]').type(`QA ออโต้โค้ด ${stamp}`)
    cy.contains('label', 'ไม่มีวันหมดอายุ').click()

    cy.contains('button', 'เพิ่มรายการคูปอง').click()
    dlg().should('be.visible')
    dlg().find('input[name="translations.0.name"]').type(`ออโต้ ${stamp}`)
    dlg().find('input[name="discountValue"]').clear().type('10')

    // สลับเป็นสร้างรหัสอัตโนมัติ → ฟิลด์รหัสเดียวหาย, ขึ้น prefix/length/charset/จำนวนโค้ด
    dlg().contains('label', 'สร้างรหัสอัตโนมัติ').click()
    dlg().contains('คำนำหน้ารหัส').should('be.visible')
    dlg().contains('ความยาวส่วนท้าย').should('be.visible')
    dlg().contains('ชุดอักขระ').should('be.visible')
    dlg().contains('จำนวนโค้ดที่จะสร้าง').should('be.visible')
    dlg().find('input[name="code"]').should('not.exist')
  })
})
