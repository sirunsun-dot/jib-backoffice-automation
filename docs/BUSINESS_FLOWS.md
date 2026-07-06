# Business Flows — JIB Backoffice

เอกสารอธิบาย flow จริงของแต่ละหน้า (จาก BA) ใช้ประกอบการเขียน/ตีความ test case

**Environment:** https://devstorex.jibc.codelabdev.co  
**Account ทดสอบ:** sirun.sun@codelabdev.co

---

## 1. หน้าที่ Fail ใน automated test แต่เป็นพฤติกรรมที่ถูกต้อง

### หน้าหลัก (`/main`)
- **สถานะ:** ยังไม่ได้ทำ — ปล่อยไว้ก่อน
- **URL `/main` → 404:** คาดหวังได้ (ยังไม่ implement)
- **Test:** ไม่ต้องเทส create/CRUD

### จัดการลูกค้า (`/customer-manager/customers`)
- **เพิ่มลูกค้า:** ลูกค้าเข้ามาเมื่อ **login ที่ Frontstore** — ไม่ได้สร้างจาก Backoffice
- **Backoffice ทำได้:** แก้ไข, ลบ, เปิด-ปิดการใช้งาน
- **Create `/customers/create` → 404:** คาดหวังได้ — ไม่ใช่บัค
- **Test ที่ควรมี:** List, ค้นหา, แก้ไข, ลบ, toggle สถานะ

### Commercial Products (`/store/product-manager/enterprise-products`)
- **ความหมาย:** เลือกสินค้าทั่วไปมาเป็นสินค้าองค์กร — **ไม่มี flow อื่น**
- **ไม่ใช่:** duplicate ของ Products create form แบบเต็ม
- **Test:** เลือกสินค้าจาก list, assign เป็น commercial

### ร้านค้า / Warehouses (`/store/product-manager/warehouses`)
- **สร้างร้านค้า:** **ไม่ต้องเพิ่ม** จาก Backoffice
- **ไม่มีปุ่มเพิ่ม + Create 404:** คาดหวังได้
- **Test:** ดู list / จัดการที่มีอยู่เท่านั้น

### ใบเสนอราคา (`/store/quotation-manager/quotations`)
- **สร้างใบเสนอราคา:** ลูกค้ากด **ขอใบเสนอราคาจาก Frontstore** → แสดงใน Backoffice
- **Backoffice:** ดู/จัดการใบที่เข้ามา — ไม่ได้สร้างใหม่จากหน้า create
- **Create form ไม่ครบ:** คาดหวังได้ถ้าไม่มี flow create

### Permissions (`/permission-manager/permissions`)
- **สถานะ:** ยังไม่มีคำอธิบาย flow จาก BA (รอเพิ่ม)

---

## 2. สินค้า (Products) — Flow สร้าง/แก้ไข

**URL List:** `/store/product-manager/products`  
**URL Create:** `/store/product-manager/products/create`

### ข้อมูลทั่วไป
| ฟิลด์ | กฎ |
|-------|-----|
| SKU | กรอกมั่วๆ ไม่ซ้ำ |
| แบรนด์ | เลือกจาก [Brands](https://devstorex.jibc.codelabdev.co/store/product-manager/brands) |
| หมวดหมู่ | จาก [Categories](https://devstorex.jibc.codelabdev.co/store/product-manager/categories) |
| รับประกัน | จาก [Warranties](https://devstorex.jibc.codelabdev.co/store/product-manager/warranties) |
| ชื่อสินค้า | **บังคับ** |
| อื่นๆ | ไม่บังคับ |

### รูปภาพ / วีดีโอ / 360
- ไม่บังคับ (กรอกได้ถ้าต้องการ)

### ไฮไลท์ / ฟีเจอร์
- ไม่บังคับ

### คุณสมบัติ (Template)
- เทมเพลตมาจาก [Template Attributes](https://devstorex.jibc.codelabdev.co/store/product-manager/template-attributes) ตาม **category1 + category2** ที่เลือกในข้อมูลทั่วไป
- ถ้าไม่รู้จะเลือก: **category1 = เซียมซี**, **category2 = เซียมซีย่อย1** (หรือสร้างเอง)
- ต้องกรอกข้อมูลในเทมเพลตด้วย

### คลังสินค้าและราคา
- กรอกข้อมูลให้ครบที่ทำได้
- **สำคัญ:** เปิด toggle **การแสดงผลบนเว็บไซต์** และ **การเปิดขาย** เพื่อให้แสดงบน Frontstore

### แท็กสินค้า
- เลือกสุ่มๆ ได้

### ตัวกรองสินค้า
- มาจาก [Filters](https://devstorex.jibc.codelabdev.co/store/product-manager/filters) ตาม category1/category2 ที่เลือก
- กดเลือก filter ที่ต้องการ

### ประเภทการใช้งาน
- เลือกสุ่มๆ ได้

### SEO
- ไม่บังคับ

### กฎการบันทึก (สำคัญ)
> เมื่อกดบันทึกครั้งแรกถ้าข้อมูลไม่ครบจะขึ้น **validation**  
> **ไม่จำเป็นต้องกรอกให้ครบ** — กดบันทึกอีกครั้งเพื่อบันทึกผ่านได้

---

## 3. Dependency map (Products)

```
Brands ──────────────┐
Categories ──────────┼──► Products (Create)
Warranties ──────────┤
Template Attributes ─┤ (ตาม category1/2)
Filters ─────────────┘ (ตาม category1/2)
Tags ────────────────► (optional)
Usage Type ──────────► (optional)
```

---

## 4. สรุป: Automated test ที่ต้องปรับตีความ

| หน้า | เดิม (automated) | ความจริง (BA) |
|------|------------------|---------------|
| Main | Fail 404 | Expected — ยังไม่ทำ |
| Customers | Fail Create 404 | Expected — ลูกค้ามาจาก Frontstore |
| Warehouses | Fail ไม่มีปุ่มเพิ่ม | Expected — ไม่ต้องเพิ่ม |
| Quotations | Fail Create | Expected — มาจาก Frontstore request |
| Commercial Products | Fail Create | อาจไม่มี create แบบ form — แค่เลือกสินค้า |
| Products CR004 validation | อาจ Fail/Warning | validation ครั้งแรกแล้วกดบันทึกซ้ำผ่านได้ |

---

*อัปเดต: 2026-06-15 — จากคำอธิบาย BA*
