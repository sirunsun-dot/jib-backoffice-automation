/** Build JIB_TestCases_FreebieProducts_Full.csv */
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '../JIB_TestCases_FreebieProducts_Full.csv')
let results = {}
try { results = JSON.parse(fs.readFileSync(path.join(__dirname, 'freebie-test-results.json'), 'utf8')) } catch {}

const ROWS = [
  { type: 'part', text: 'PART 1: หน้า List (รายการสินค้าของแถม)' },
  { type: 'sub', text: 'A. การโหลดหน้า + UI Elements' },
  { id: 'J-FBP-LP001', cat: 'Page Load', obj: 'เปิดหน้ารายการ', desc: '1. เข้า URL /freebie-products', data: '-', exp: 'ตาราง + controls ครบ' },
  { id: 'J-FBP-LP002', cat: 'UI', obj: 'Breadcrumb', desc: '1. ดู', data: '-', exp: 'มี "สินค้าของแถม"' },
  { id: 'J-FBP-LP003', cat: 'UI', obj: 'Header + คำอธิบาย', desc: '1. ดูหัวข้อ', data: '-', exp: "'สินค้าของแถม' + 'จัดการสินค้าของแถมในระบบ'" },
  { id: 'J-FBP-LP004', cat: 'UI', obj: 'คอลัมน์ตาราง', desc: '1. ดู thead', data: '-', exp: 'มี สินค้า, SKU, การเชื่อมต่อ ITECH, สต๊อก, ประเภทสินค้า, จัดการ' },
  { id: 'J-FBP-LP005', cat: 'UI', obj: 'Action Bar + Tabs', desc: '1. ดู', data: '-', exp: 'ทั้งหมด/ถังขยะ tabs + ค้นหา + ตัวกรอง + ปรับแต่งคอลัมน์ + เพิ่มสินค้าของแถม' },
  { id: 'J-FBP-LP006', cat: 'UI', obj: "Tab 'ทั้งหมด' มี count", desc: "1. ดู 'ทั้งหมด N'", data: '-', exp: 'แสดงจำนวน' },
  { id: 'J-FBP-LP007', cat: 'UI', obj: "Tab 'ถังขยะ' มี count", desc: '1. ดู', data: '-', exp: 'แสดงจำนวน trash' },
  { type: 'sub', text: 'B. การค้นหา' },
  { id: 'J-FBP-LP010', cat: 'Search', obj: 'ค้นหา TH', desc: '1. พิมพ์', data: '-', exp: 'กรอง' },
  { id: 'J-FBP-LP011', cat: 'Search', obj: 'ค้นหา SKU', desc: '1. พิมพ์ SKU', data: '-', exp: 'กรองตาม SKU' },
  { id: 'J-FBP-LP012', cat: 'Search', obj: 'ไม่มี keyword', desc: '1. พิมพ์ไม่มี', data: '-', exp: 'empty state' },
  { id: 'J-FBP-LP013', cat: 'Search', obj: 'XSS', desc: '1. <script>', data: '-', exp: 'รับเป็น text' },
  { id: 'J-FBP-LP014', cat: 'Search', obj: 'เคลียร์', desc: '1. ลบ', data: '-', exp: 'กลับมา' },
  { type: 'sub', text: 'C. Tabs + Trash' },
  { id: 'J-FBP-LP020', cat: 'Tab', obj: "เลือก Tab 'ถังขยะ'", desc: '1. คลิก', data: '-', exp: 'แสดง record ใน trash' },
  { id: 'J-FBP-LP021', cat: 'Tab', obj: "เลือก Tab 'ทั้งหมด'", desc: '1. คลิก', data: '-', exp: 'แสดงทั้งหมด' },
  { type: 'sub', text: 'D. ตัวกรอง + ปรับแต่งคอลัมน์' },
  { id: 'J-FBP-LP030', cat: 'Filter', obj: 'ปุ่ม ตัวกรอง', desc: '1. คลิก', data: '-', exp: 'sheet เปิด' },
  { id: 'J-FBP-LP031', cat: 'Filter', obj: 'ESC ปิด', desc: '1. ESC', data: '-', exp: 'ปิด' },
  { id: 'J-FBP-LP032', cat: 'Customize', obj: 'ปุ่ม ปรับแต่งคอลัมน์', desc: '1. คลิก', data: '-', exp: 'menu เปิด' },
  { id: 'J-FBP-LP033', cat: 'Customize', obj: "ซ่อน 'SKU'", desc: '1. uncheck', data: '-', exp: 'หาย' },
  { id: 'J-FBP-LP034', cat: 'Customize', obj: 'เปิดกลับ', desc: '1. check', data: '-', exp: 'กลับมา' },
  { type: 'sub', text: 'E. จำนวนแถว + Pagination' },
  { id: 'J-FBP-LP040', cat: 'Rows', obj: 'ดู options', desc: '1. คลิก', data: '-', exp: '10/20/50/100' },
  { id: 'J-FBP-LP041', cat: 'Rows', obj: 'เลือก 20', desc: '1. เลือก', data: '-', exp: '≤ 20 row' },
  { id: 'J-FBP-LP042', cat: 'Pagination', obj: 'Default ≤ 10', desc: '1. ดู', data: '-', exp: '≤ 10 row' },
  { id: 'J-FBP-LP043', cat: 'Pagination', obj: 'Footer format', desc: '1. ดู', data: '-', exp: "'X - Y จาก Z รายการ'" },
  { type: 'sub', text: 'F. Row Actions' },
  { id: 'J-FBP-LP050', cat: 'Row', obj: 'ปุ่ม Edit', desc: '1. คลิก', data: '-', exp: '/freebie-products/update/{id}' },
  { id: 'J-FBP-LP051', cat: 'Row', obj: '3-dot menu', desc: '1. คลิก', data: '-', exp: 'menu items' },
  { type: 'sub', text: "G. ปุ่ม 'เพิ่มสินค้าของแถม'" },
  { id: 'J-FBP-LP060', cat: 'Add', obj: 'คลิก', desc: '1. คลิก', data: '-', exp: '/freebie-products/create' },

  { type: 'part', text: 'PART 2: หน้า Create — ฟอร์มซับซ้อน (Product-style form)' },
  { type: 'sub', text: 'H. Header + Sections + Default state' },
  { id: 'J-FBP-CR001', cat: 'UI', obj: 'Header', desc: '1. ดูหัวข้อ', data: '-', exp: "'เพิ่มสินค้าของแถม'" },
  { id: 'J-FBP-CR002', cat: 'UI', obj: 'Section ข้อมูลทั่วไป', desc: '1. ดู section', data: '-', exp: 'visible' },
  { id: 'J-FBP-CR003', cat: 'UI', obj: 'Section รูปภาพ/วีดีโอ/360', desc: '1. ดู section', data: '-', exp: 'visible' },
  { id: 'J-FBP-CR004', cat: 'UI', obj: 'Section คลังสินค้าและราคา', desc: '1. ดู section', data: '-', exp: 'visible' },
  { id: 'J-FBP-CR005', cat: 'UI', obj: 'Status default = กำลังเปิดใช้งาน', desc: '1. ดู switch', data: '-', exp: 'checked' },
  { id: 'J-FBP-CR006', cat: 'UI', obj: '2x sync toggles', desc: '1. ดู', data: '-', exp: 'ใช้เหมือนกัน 2 ภาษา (สำหรับ name + highlight)' },
  { id: 'J-FBP-CR007', cat: 'UI', obj: 'Progress indicator', desc: '1. ดู', data: '-', exp: "'ยังไม่มีข้อมูล 0%'" },
  { id: 'J-FBP-CR008', cat: 'UI', obj: 'ปุ่มบันทึก + ดูตัวอย่าง', desc: '1. ดู', data: '-', exp: 'มี' },
  { type: 'sub', text: 'I. SKU + ชื่อ + Highlight' },
  { id: 'J-FBP-CR010', cat: 'SKU', obj: 'กรอก SKU ปกติ', desc: '1. กรอก', data: '-', exp: 'รับค่าได้' },
  { id: 'J-FBP-CR011', cat: 'SKU', obj: 'SKU พิเศษ', desc: "1. กรอก 'JIB-001/!'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-FBP-CR012', cat: 'NameTH', obj: 'ชื่อ TH', desc: '1. กรอก', data: '-', exp: 'รับค่าได้' },
  { id: 'J-FBP-CR013', cat: 'NameTH', obj: 'TH ยาว 255', desc: '1. 255 ตัว', data: '-', exp: 'รับ' },
  { id: 'J-FBP-CR014', cat: 'NameTH', obj: 'TH ยาว 300', desc: '1. 300 ตัว', data: '-', exp: 'block/warning' },
  { id: 'J-FBP-CR015', cat: 'NameTH', obj: 'XSS', desc: '1. <script>', data: '-', exp: 'รับเป็น text' },
  { id: 'J-FBP-CR016', cat: 'NameEN', obj: 'EN locked (sync ON)', desc: '1. ดู EN', data: '-', exp: 'disabled' },
  { id: 'J-FBP-CR017', cat: 'NameEN', obj: 'ปิด sync → EN unlock', desc: '1. คลิก toggle', data: '-', exp: 'editable' },
  { id: 'J-FBP-CR018', cat: 'Highlight', obj: 'การ์ดสินค้า TH', desc: '1. กรอก', data: '-', exp: 'รับค่าได้' },
  { id: 'J-FBP-CR019', cat: 'Highlight', obj: 'การ์ดสินค้า EN sync', desc: '1. ดู EN sync toggle', data: '-', exp: 'มี toggle แยก' },
  { type: 'sub', text: 'J. Comboboxes (Brand/หมวดหมู่/รับประกัน)' },
  { id: 'J-FBP-CR030', cat: 'Combobox', obj: 'เลือกแบรนด์สินค้า', desc: '1. คลิก combobox', data: '-', exp: 'dropdown เปิด' },
  { id: 'J-FBP-CR031', cat: 'Combobox', obj: 'เลือกการรับประกัน', desc: '1. คลิก', data: '-', exp: 'dropdown เปิด' },
  { id: 'J-FBP-CR032', cat: 'Combobox', obj: 'เลือกหมวดหมู่หลัก', desc: '1. คลิก', data: '-', exp: 'dropdown' },
  { id: 'J-FBP-CR033', cat: 'Combobox', obj: 'เลือกหมวดหมู่รอง', desc: '1. คลิก', data: '-', exp: 'dropdown' },
  { id: 'J-FBP-CR034', cat: 'Combobox', obj: 'เลือกหมวดหมู่สินค้า', desc: '1. คลิก', data: '-', exp: 'dropdown' },
  { type: 'sub', text: 'K. ปุ่มบันทึก / ยกเลิก' },
  { id: 'J-FBP-CR040', cat: 'Save', obj: 'บันทึกฟอร์มเปล่า', desc: '1. คลิก save', data: '-', exp: 'error required' },
  { id: 'J-FBP-CR041', cat: 'Exit', obj: 'beforeunload dirty', desc: '1. กรอก + navigate', data: '-', exp: 'browser warning' },

  { type: 'part', text: '⭐ PART 3: CRUD Cycle (Simplified)' },
  { id: 'J-FBP-CRUD001', cat: 'CRUD-Create', obj: 'สร้าง freebie product ใหม่ผ่าน UI', desc: '1. เปิด /create | 2. กรอก SKU + ชื่อ TH unique | 3. บันทึก', data: '-', exp: "save + record ใน list" },
  { id: 'J-FBP-CRUD002', cat: 'CRUD-Verify', obj: 'ค้นหา record', desc: '1. ค้นหา', data: '-', exp: 'พบ' },
  { id: 'J-FBP-CRUD010', cat: 'CRUD-Edit', obj: 'เปิด Edit + แก้ชื่อ', desc: '1. คลิก ดินสอ + แก้ + save', data: '-', exp: 'อัพเดต' },
  { id: 'J-FBP-CRUD020', cat: 'CRUD-Delete', obj: 'ลบ record', desc: '1. menu → ลบ → ยืนยัน', data: '-', exp: 'หาย/ย้ายไป trash' },
  { id: 'J-FBP-CRUD021', cat: 'CRUD-Verify', obj: 'verify หาย', desc: '1. ค้นหา', data: '-', exp: 'ไม่พบ' },

  { type: 'part', text: 'PART 4: หน้า Edit + Invalid ID' },
  { id: 'J-FBP-ED001', cat: 'Edit-Open', obj: 'Invalid ID', desc: '1. /update/99999999', data: '-', exp: '404 / redirect' },

  { type: 'part', text: 'PART 5: UI/UX + Security' },
  { id: 'J-FBP-UX001', cat: 'Responsive', obj: 'Desktop 1920', desc: '1. เปิด', data: '-', exp: 'Layout ปกติ' },
  { id: 'J-FBP-UX002', cat: 'Responsive', obj: 'Tablet/Mobile', desc: '1. ปรับ', data: '-', exp: 'Responsive' },
  { id: 'J-FBP-UX003', cat: 'Browser-Chrome', obj: 'Chrome', desc: '1. เปิด', data: '-', exp: 'ทำงาน' },
  { id: 'J-FBP-UX004', cat: 'Browser-Other', obj: 'Firefox/Safari/Edge', desc: '1. test', data: '-', exp: 'ทำงาน' },
  { id: 'J-FBP-SEC001', cat: 'Permission-NoLogin', obj: 'ไม่ login', desc: '1. logout', data: '-', exp: 'redirect login' },
  { id: 'J-FBP-SEC002', cat: 'XSS-Display', obj: 'XSS display', desc: '1. สร้างชื่อ <script>', data: '-', exp: 'เป็น text' },
  { id: 'J-FBP-SEC003', cat: 'CSRF', obj: 'CSRF token', desc: '1. ตรวจ', data: '-', exp: 'มี token' },
]

function field(s) { if (s == null) return ''; s = String(s); if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`; return s }
const blank = ',,,,,,,'
const sectionRow = (text) => `${field(text)},,,,,,,`
const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
const lines = [
  `Project Name :,JIB-Ecommerce,,,Create Date :,2026-06-01,,`,
  `Project ID :,,,,Start Test Date :,2026-06-01,,`,
  `Tester Name :,admin zero,,,Finish Test Date :,2026-06-01,,`,
  `Project Release / Version :,1.0,,,Module / Function :,${field('สินค้าของแถม (Freebie Products) - List + Create + Edit + CRUD')},,`,
  `URL List :,https://devstorex.jibc.codelabdev.co/store/promotion-manager/freebie-products,,,,,,`,
  `URL Create :,https://devstorex.jibc.codelabdev.co/store/promotion-manager/freebie-products/create,,,,,,`,
  blank,
  `Test Case ID,Category,Test case Objective,Test Description / Procedure,Test Data,Expected Result,Actual Result,Result (Pass/Fail)`,
  blank,
]
for (const row of ROWS) {
  if (row.type === 'part') { lines.push(sectionRow(`---- ${row.text} ----`)); lines.push(blank); continue }
  if (row.type === 'sub') { lines.push(sectionRow(`-- ${row.text} --`)); continue }
  const r = results[row.id] || {}
  const actual = r.actual || 'ไม่ได้ทดสอบใน automated run นี้'
  const result = r.result || 'Not Tested'
  sum[result] = (sum[result] || 0) + 1
  lines.push([row.id, row.cat, row.obj, row.desc, row.data, row.exp, actual, result].map(field).join(','))
}
const total = Object.values(sum).reduce((a, b) => a + b, 0)
const passRate = total ? ((sum.Pass / total) * 100).toFixed(1) : '0.0'
const failRate = total ? ((sum.Fail / total) * 100).toFixed(1) : '0.0'

lines.push(blank)
lines.push(sectionRow('-- สรุปผลทดสอบรวม (Summary) --'))
lines.push(`Total Test Cases :,${ROWS.filter((r) => r.id).length},,,,,,`)
lines.push(`Pass :,${sum.Pass},,,Fail :,${sum.Fail},,`)
lines.push(`Warning :,${sum.Warning},,,Not Tested :,${sum['Not Tested']},,`)
lines.push(blank)
lines.push(`Pass Rate :,${passRate}%,,,Fail Rate :,${failRate}%,,`)
lines.push(blank)
lines.push(`Notes :,${field('1. ทดสอบบน Chromium Puppeteer')},,,,,,`)
lines.push(`,${field('2. สินค้าของแถม = product-style form ที่ซับซ้อนสุด (SKU, ชื่อ, การ์ด, แบรนด์, รับประกัน, หมวดหมู่หลัก/รอง/สินค้า, รูปภาพ, คลังสินค้า, ราคา)')},,,,,,`)
lines.push(`,${field('3. ⭐ PART 3 CRUD: พยายามสร้าง→แก้→ลบ - ฟอร์มต้อง required หลายฟิลด์เพิ่ม จึง CRUD บางส่วนอาจ Not Tested ถ้าฟิลด์ required ไม่ครบ')},,,,,,`)
lines.push(`,${field('4. มี Tab "ทั้งหมด" + "ถังขยะ" (soft delete)')},,,,,,`)

fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log('freebie:', sum, '| pass rate:', passRate + '%')
