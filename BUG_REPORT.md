# Bug Report — Promotion Manager (Promotions / Free-Gifts / Coupons)

วันที่ทดสอบ: 2026-05-25
ระบบ: https://devstorex.jibc.codelabdev.co
บัญชีที่ใช้ทดสอบ: sirun.sun@codelabdev.co
หมายเหตุ: Cypress binary ติด macOS Gatekeeper รันด้วย `npx cypress run` ไม่ได้ จึงรันผ่าน Playwright manual ตามสคริปต์เทสที่เขียนไว้

---

## 🔴 บั๊กรุนแรง (Critical / High)

### BUG #1 — Promotions: บันทึกได้แม้ไม่มีรายการโปรโมชั่นเลย
- **หน้า:** `/store/promotion-manager/promotions/create`
- **ขั้นตอน:** กรอกแค่ชื่อ TH + เลือก "ไม่มีวันหมดอายุ" → กดบันทึก
- **ที่คาดหวัง:** validation ขัด "ต้องเพิ่มรายการโปรโมชั่นอย่างน้อย 1 รายการ" (เหมือนหน้า Coupons)
- **ที่เกิดขึ้น:** ระบบบันทึกสำเร็จ ได้ record `ทดสอบโปรโมชั่น` มี **จำนวนสินค้าโปรโมชั่น = 0** อยู่ในตาราง
- **กระทบ:** มี promotion ขยะในระบบไม่มีสินค้าใดๆ
- **เปรียบเทียบ:** หน้า Coupons validate ถูก ("กรุณาเพิ่มรายการคูปองอย่างน้อย 1 รายการ")

### BUG #2 — Free-Gifts: กดบันทึกแล้วเงียบสนิท (silent failure)
- **หน้า:** `/store/promotion-manager/free-gifts/create`
- **ขั้นตอน:** กรอกชื่อ TH "ทดสอบของแถม" + เลือก "ไม่มีวันหมดอายุ" → กดบันทึก
- **ที่คาดหวัง:** บันทึกสำเร็จ + redirect ไปหน้า list หรือแสดง error/toast
- **ที่เกิดขึ้น:**
  - URL ค้างที่ `/free-gifts/create`
  - ไม่มี error message
  - ไม่มี toast notification
  - ไม่มี loading indicator
- **กระทบ:** ผู้ใช้ไม่รู้ว่ากดสำเร็จหรือไม่ ไม่ทราบสาเหตุที่บันทึกไม่ได้

### BUG #3 — Promotions list: มี record ที่ชื่อโปรโมชั่นว่าง / ผิดปกติ
- **หน้า:** `/store/promotion-manager/promotions`
- **ที่เห็น:** แถวที่ 1 (`#1`) ฟิลด์ "ชื่อโปรโมชัน" ว่างเปล่า แต่ฟิลด์ "รายการโปรโมชัน" แสดงคำว่า "ไทย"
- **คาดเดา:** น่าจะเป็นผลพวงจาก BUG #1 (โปรโมชั่นถูกสร้างโดยไม่มีข้อมูลครบ) หรือ data integrity issue ใน DB
- **กระทบ:** UX แย่ ผู้ดูแลระบบไม่ทราบว่า record นี้คืออะไร

---

## 🟡 บั๊กระดับกลาง (Medium)

### BUG #4 — Free-Gifts list: ป้าย "เปิดใช้งาน" ทั้งที่ไม่มีวันที่
- **หน้า:** `/store/promotion-manager/free-gifts`
- **ที่เห็น:** Record `#1` ชื่อ "1", **วันที่เริ่ม = "-"**, **วันที่สิ้นสุด = "-"**, แต่สถานะแสดง "เปิดใช้งาน"
- **ที่คาดหวัง:** ถ้าไม่มีวันที่เริ่ม → ระบบควรไม่ active หรือแสดงเป็น "ไม่มีวันหมดอายุ"
- **กระทบ:** ผู้ใช้งงว่ารายการนี้ "active" ตอนไหน

### BUG #5 — Free-Gifts list: ผู้สร้างเป็น "-" 
- **หน้า:** `/store/promotion-manager/free-gifts`
- **ที่เห็น:** ฟิลด์ "ผู้สร้าง" = "-" ทั้งที่ทุก record ควรมี audit trail
- **กระทบ:** ไม่สามารถ track ใครสร้าง record นี้

### BUG #6 — ภาษาเก็บไม่สม่ำเสมอ: "แคมเปญ" vs "ของแถม"
- **หน้า:** `/store/promotion-manager/free-gifts/create`
- **ที่เห็น:**
  - Field label: `ชื่อแคมเปญ - ภาษาไทย *`
  - Error message: `กรุณากรอกชื่อของแถม - ภาษาไทย`
- **ที่คาดหวัง:** ใช้คำเดียวกันทั้ง label และ error
- **กระทบ:** ผู้ใช้สับสนว่ากำลังกรอกอะไรกันแน่

### BUG #7 — Validation: "ใช้เหมือนกัน 2 ภาษา" ON แต่ error EN ยังโผล่
- **หน้าทั้ง 3:** Promotions / Free-Gifts / Coupons (create page)
- **ขั้นตอน:** ครั้งแรกที่กดบันทึกบนฟอร์มเปล่า (toggle "ใช้เหมือนกัน 2 ภาษา" = ON, field EN disabled)
- **ที่เห็น:** error แสดง 2 บรรทัด:
  - `กรุณากรอกชื่อ... - ภาษาไทย`
  - `กรุณากรอกชื่อ... - ภาษาอังกฤษ` ← ไม่ควรขึ้น
- **ที่คาดหวัง:** เมื่อ toggle เปิดอยู่ ระบบ sync TH→EN อัตโนมัติ ไม่ควร error EN
- **หลังพิมพ์ TH:** error EN หายไปเอง (เพราะ value sync) แต่ตอนแรกทำให้ผู้ใช้สับสน

### BUG #8 — Promotions create: รหัสโปรโมชั่นใช้สระต่างกัน (โปรโมชั่น vs โปรโมชัน)
- **หน้า:** `/store/promotion-manager/promotions/create`
- **ที่เห็น:**
  - Label: `ชื่อโปรโมชั่น - ภาษาไทย` (มี "ั่น")
  - Error message: `กรุณากรอกชื่อโปรโมชัน - ภาษาไทย` (ไม่มี "ั่น")
  - Heading: `เพิ่มแคมเปญโปรโมชั่น`
  - Wizard heading: `เพิ่มรายการโปรโมชัน` (ไม่มี "ั่น")
- **กระทบ:** ความไม่ consistent ของการสะกด

### BUG #9 — Date validation message ไม่ consistent ระหว่าง 3 หน้า
| หน้า | ข้อความ Error |
|------|--------------|
| Promotions | `กรุณากรอกระยะเวลาโปรโมชั่น` |
| Free-Gifts | `กรุณาเลือกวันที่เริ่มต้น` |
| Coupons | `กรุณาเลือกวันเริ่มต้น` / `กรุณาเลือกวันสิ้นสุด` (มีคำว่า "ที่" ไม่เหมือนกัน) |

### BUG #10 — Promotions list หน้าแรกโหลด: skeleton ค้างนาน
- **หน้า:** `/store/promotion-manager/promotions`
- **ที่เห็น:** หลังเปิดหน้า skeleton loader ค้างทั้งตาราง 20 แถว ~10 วินาที กว่าจะโหลดข้อมูล (บางครั้งโดน 401 invalid token ทำให้ค้างจนกว่าจะ retry)
- **เปรียบเทียบ:** Free-Gifts/Coupons โหลดเร็วกว่ามาก
- **กระทบ:** UX แย่ผู้ใช้คิดว่าระบบค้าง

---

## 🟢 บั๊กเล็ก (Minor / UX)

### BUG #11 — Coupons: "มูลค่าส่วนลด" ใน dialog เริ่ม 0% ไม่ validate
- **หน้า:** `/store/promotion-manager/coupons/create` → dialog "เพิ่มรายการคูปอง"
- **ที่เห็น:** Field "มูลค่าส่วนลด *" default = `0` (%) สามารถยืนยันด้วย 0% ผ่านได้
- **ที่คาดหวัง:** ส่วนลด 0% ไม่มีประโยชน์ทางธุรกิจ ควร validate > 0

### BUG #12 — ปุ่ม "เพิ่มรายการ" (Free-Gifts/Coupons) เปิด dialog ใหญ่เต็มจอ
- **ที่เห็น:** Dialog `data-state="open"` แต่ `offsetParent: null` เพราะ position fixed — ไม่ใช่บั๊กฟังก์ชัน แต่ทำให้ Cypress test ที่ใช้ `should('be.visible')` อาจ assertion fail ต้องใช้ `data-state="open"` แทน
- **กระทบ test automation:** test script ต้องปรับ selector

### BUG #13 — beforeunload prompt ขณะ navigate ออกจากฟอร์ม
- **หน้า:** `/free-gifts/create` หลังกรอกชื่อ
- **ที่เห็น:** เปลี่ยนหน้าทำให้ขึ้น browser native dialog (beforeunload)
- **ที่คาดหวัง:** OK ในเชิง UX แต่ test automation ต้องเตรียม handle dialog

---

## ✅ สิ่งที่ทำงานถูกต้อง

- **Coupons validation:** สมบูรณ์ที่สุด ตรวจ TH/EN/วันเริ่ม/วันสิ้นสุด/อย่างน้อย 1 รายการคูปอง
- **Search "ไม่พบข้อมูล" + "0 - 0 จาก 0 รายการ":** ทำงานครบทั้ง 3 หน้า
- **Filter sheet:** เปิด/ปิดได้ทั้ง 3 หน้า มี option ครบ (สถานะ, เรียงลำดับ, วันที่ preset)
- **Toggle "ใช้เหมือนกัน 2 ภาษา":** sync ค่าจาก TH→EN ถูกต้อง
- **Radio "ระบุระยะเวลา / ไม่มีวันหมดอายุ":** เลือกแล้วเปลี่ยน UI ถูก
- **URL query param `?search=xxx`:** sync กับ search input ถูกต้อง

---

## 📋 สรุปลำดับความสำคัญ

| Priority | จำนวน | รายการ |
|----------|------|--------|
| Critical | 3 | #1, #2, #3 |
| Medium | 7 | #4, #5, #6, #7, #8, #9, #10 |
| Minor | 3 | #11, #12, #13 |

## 🎯 Top 3 ที่ต้องแก้ก่อน

1. **BUG #1** Promotions ต้องบังคับมีรายการอย่างน้อย 1 (เหมือน Coupons)
2. **BUG #2** Free-Gifts ต้องโชว์ error/loading state ตอนกดบันทึก
3. **BUG #3** Cleanup data ใน Promotions list ที่ชื่อว่างเปล่า

---

## โปรผ่อน 0% (Installment Prozero) — ทดสอบ 2026-07-02

บัญชี: **Demo Login** (`เข้าสู่ระบบ Demo`)  
สคริปต์: `scripts/run-installment-prozero-create-deep-tests.js`  
ผล: Pass 31 / Fail 3 / Warning 2 (36 cases)

### IPZ-DATE-001 — วันสิ้นสุดก่อนวันเริ่มยังกด「ใช้งาน」ได้ (High)
- **หน้า:** `/store/installment/installment-prozero/create`
- **ขั้นตอน:** เลือกวันสิ้นสุดก่อน แล้วเลือกวันเริ่ม → กด「ใช้งาน」
- **คาดหวัง:** ปุ่มใช้งาน disabled หรือแสดง error
- **เกิดขึ้น:** กดใช้งานได้ ไม่มี validation error

### IPZ-PLAN-001 — บันทึกได้โดยไม่เลือกธนาคารในแผน (High)
- **Test:** J-IPZ-CD036
- **ขั้นตอน:** กรอกวันที่ + แผน (ไม่เลือกธนาคาร) + สินค้า → บันทึก
- **คาดหวัง:** validation error
- **เกิดขึ้น:** API 201 สร้างสำเร็จ

### IPZ-UI-001 — Toggle ปิดสถานะไม่เปลี่ยน state (Medium)
- **Test:** J-IPZ-CD050
- **คาดหวัง:** `data-state=unchecked` เมื่อปิด
- **เกิดขึ้น:** ยังเป็น `checked` (แต่ CD062 บันทึกได้ — ต้องตรวจว่า isActive จริงใน DB)

### IPZ-UI-002 — Progress bar ค้าง 0% ทั้งที่กรอกครบ (Low)
- **Test:** J-IPZ-CD060–064
- **เกิดขึ้น:** บันทึกสำเร็จ (api=201) แต่แสดง「ยังไม่มีข้อมูล 0%」

### IPZ-VAL-001 — มีวันที่+แผน แต่ไม่มีสินค้า บันทึกแล้วไม่ขึ้น error (Medium)
- **Test:** J-IPZ-CD003
- **คาดหวัง:** error เรื่องสินค้า
- **เกิดขึ้น:** `errs=[]` ไม่ redirect

### สิ่งที่ทำงานถูกต้อง ✅
- Validation ฟอร์มว่าง (วันเริ่ม/สิ้นสุด/แผน)
- Date picker ต้องกด「ใช้งาน」หลังเลือกช่วงวัน
- ธนาคารครบ 4 รายการ (KBANK, KTC, KTC Proud, KCC)
- หลายแผน / ลบแผน / งวดไม่ถูกต้อง (0, abc, ว่าง) ไม่ save
- SKU ปลอม →「ไม่พบ」
- กฎ 1:1 สินค้า — ไม่ให้เพิ่มซ้ำใน form
- 409 INSTALLMENT_OVERLAP เมื่อ SKU+ธนาคารทับซ้อน (แสดง「ทับซ้อน」ใน UI)
- E2E สร้างสำเร็จ 5 รูปแบบ (api=201)
