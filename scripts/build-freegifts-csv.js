/** Build JIB_TestCases_FreeGifts_Full.csv */
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '../JIB_TestCases_FreeGifts_Full.csv')
let results = {}
try { results = JSON.parse(fs.readFileSync(path.join(__dirname, 'freegifts-test-results.json'), 'utf8')) } catch {}

const ROWS = [
  { type: 'part', text: 'PART 1: หน้า List (รายการของแถม)' },
  { type: 'sub', text: 'A. การโหลดหน้า + UI Elements' },
  { id: 'J-FG-LP001', cat: 'Page Load', obj: 'เปิดหน้ารายการ', desc: '1. /free-gifts', data: '-', exp: 'ตาราง + controls' },
  { id: 'J-FG-LP002', cat: 'UI', obj: 'Breadcrumb', desc: '1. ดู', data: '-', exp: 'มี "ของแถม"' },
  { id: 'J-FG-LP003', cat: 'UI', obj: 'Header + คำอธิบาย', desc: '1. ดู', data: '-', exp: "'ของแถม' + 'รายการของแถมทั้งหมดในระบบ'" },
  { id: 'J-FG-LP004', cat: 'UI', obj: 'คอลัมน์ตาราง', desc: '1. ดู', data: '-', exp: 'มี ชื่อของแถม, วันที่เริ่ม/สิ้นสุด, สถานะการใช้งาน, รายการทั้งหมด/เปิด/ปิด, จัดการ' },
  { id: 'J-FG-LP005', cat: 'UI', obj: 'Action Bar', desc: '1. ดู', data: '-', exp: 'ค้นหา, สถานะการใช้งาน, เรียงลำดับ, วันที่, ตัวกรอง, ปรับแต่งคอลัมน์, เพิ่มของแถม' },
  { type: 'sub', text: 'B. การค้นหา' },
  { id: 'J-FG-LP010', cat: 'Search', obj: 'ค้นหา TH', desc: '1. พิมพ์', data: '-', exp: 'กรอง' },
  { id: 'J-FG-LP011', cat: 'Search', obj: 'ไม่มี keyword', desc: '1. พิมพ์ไม่มี', data: '-', exp: 'empty state' },
  { id: 'J-FG-LP012', cat: 'Search', obj: 'XSS', desc: '1. <script>', data: '-', exp: 'รับเป็น text' },
  { id: 'J-FG-LP013', cat: 'Search', obj: 'เคลียร์', desc: '1. ลบ', data: '-', exp: 'กลับมา' },
  { type: 'sub', text: 'C. สถานะการใช้งาน + เรียงลำดับ + วันที่ + ตัวกรอง' },
  { id: 'J-FG-LP020', cat: 'Filter', obj: 'ปุ่ม สถานะการใช้งาน', desc: '1. คลิก', data: '-', exp: 'popover/dropdown เปิด' },
  { id: 'J-FG-LP021', cat: 'Filter', obj: 'ปุ่ม เรียงลำดับ (combobox)', desc: '1. คลิก', data: '-', exp: 'dropdown' },
  { id: 'J-FG-LP022', cat: 'Filter', obj: 'ปุ่ม วันที่', desc: '1. คลิก', data: '-', exp: 'date filter' },
  { id: 'J-FG-LP023', cat: 'Filter', obj: 'ปุ่ม ตัวกรอง', desc: '1. คลิก', data: '-', exp: 'sheet' },
  { id: 'J-FG-LP024', cat: 'Filter', obj: 'ESC ปิด sheet', desc: '1. ESC', data: '-', exp: 'ปิด' },
  { type: 'sub', text: 'D. ปรับแต่งคอลัมน์' },
  { id: 'J-FG-LP030', cat: 'Customize', obj: 'เปิด menu', desc: '1. คลิก', data: '-', exp: 'menu' },
  { id: 'J-FG-LP031', cat: 'Customize', obj: 'ซ่อนคอลัมน์', desc: '1. uncheck', data: '-', exp: 'หาย' },
  { id: 'J-FG-LP032', cat: 'Customize', obj: 'เปิดกลับ', desc: '1. check', data: '-', exp: 'กลับมา' },
  { type: 'sub', text: 'E. จำนวนแถว + Pagination' },
  { id: 'J-FG-LP040', cat: 'Rows', obj: 'ดู options', desc: '1. คลิก', data: '-', exp: '10/20/50/100' },
  { id: 'J-FG-LP041', cat: 'Rows', obj: 'เลือก 20', desc: '1. เลือก', data: '-', exp: '≤ 20 row' },
  { id: 'J-FG-LP042', cat: 'Pagination', obj: 'Default ≤ 10', desc: '1. ดู', data: '-', exp: '≤ 10' },
  { id: 'J-FG-LP043', cat: 'Pagination', obj: 'Footer format', desc: '1. ดู', data: '-', exp: "'X - Y จาก Z'" },
  { type: 'sub', text: 'F. Row Actions' },
  { id: 'J-FG-LP050', cat: 'Row', obj: 'ปุ่ม Edit', desc: '1. คลิก', data: '-', exp: '/update/{id}' },
  { id: 'J-FG-LP051', cat: 'Row', obj: 'Status switch inline', desc: '1. ดู', data: '-', exp: 'มี switches' },
  { id: 'J-FG-LP052', cat: 'Row', obj: '3-dot menu', desc: '1. คลิก', data: '-', exp: 'menu items' },
  { type: 'sub', text: "G. ปุ่ม 'เพิ่มของแถม'" },
  { id: 'J-FG-LP060', cat: 'Add', obj: 'คลิก', desc: '1. คลิก', data: '-', exp: '/create' },

  { type: 'part', text: 'PART 2: หน้า Create (เพิ่มแคมเปญของแถม)' },
  { type: 'sub', text: 'H. Header + Sections + Default state' },
  { id: 'J-FG-CR001', cat: 'UI', obj: 'Header', desc: '1. ดูหัวข้อ', data: '-', exp: "'เพิ่มแคมเปญของแถม'" },
  { id: 'J-FG-CR002', cat: 'UI', obj: 'TH/EN name + description', desc: '1. ดูฟิลด์', data: '-', exp: 'translations.0/1.name + description' },
  { id: 'J-FG-CR003', cat: 'UI', obj: 'Sync toggle default ON', desc: '1. ดู', data: '-', exp: 'checked' },
  { id: 'J-FG-CR004', cat: 'UI', obj: 'Status default = กำลังเปิดใช้งาน', desc: '1. ดู', data: '-', exp: 'checked' },
  { id: 'J-FG-CR005', cat: 'UI', obj: 'Date range picker (วันที่เริ่มต้น - วันที่สิ้นสุด)', desc: '1. ดู', data: '-', exp: 'มีปุ่มเลือกวันที่' },
  { id: 'J-FG-CR006', cat: 'UI', obj: 'Image upload', desc: '1. ดู', data: '-', exp: "'ลากและวางไฟล์'" },
  { id: 'J-FG-CR007', cat: 'UI', obj: 'Field remark', desc: '1. ดู', data: '-', exp: 'input[name="remark"]' },
  { id: 'J-FG-CR008', cat: 'UI', obj: "Sub-table 'ของแถม'", desc: '1. ดู', data: '-', exp: 'ตารางของแถม + ปุ่มเพิ่มรายการ' },
  { type: 'sub', text: 'I. กรอกชื่อ TH/EN + รายละเอียด' },
  { id: 'J-FG-CR010', cat: 'NameTH', obj: 'กรอก TH', desc: '1. กรอก', data: '-', exp: 'รับค่าได้' },
  { id: 'J-FG-CR011', cat: 'NameTH', obj: 'TH ยาว 255', desc: '1. 255', data: '-', exp: 'รับ' },
  { id: 'J-FG-CR012', cat: 'NameTH', obj: 'TH ยาว 300', desc: '1. 300', data: '-', exp: 'block/warning' },
  { id: 'J-FG-CR013', cat: 'NameTH', obj: 'XSS', desc: '1. <script>', data: '-', exp: 'รับเป็น text' },
  { id: 'J-FG-CR014', cat: 'NameTH', obj: 'Empty + save', desc: '1. ไม่กรอก + save', data: '-', exp: 'error required' },
  { id: 'J-FG-CR015', cat: 'SyncToggle', obj: 'ปิด toggle → EN unlock', desc: '1. คลิก', data: '-', exp: 'EN editable' },
  { id: 'J-FG-CR016', cat: 'DescTH', obj: 'รายละเอียด TH', desc: '1. กรอก', data: '-', exp: 'รับค่าได้' },
  { id: 'J-FG-CR017', cat: 'Remark', obj: 'remark field', desc: "1. กรอก 'out of stock'", data: '-', exp: 'รับค่าได้' },

  { type: 'part', text: '⭐ PART 3: CRUD Cycle (สร้าง→แก้→ลบจริง)' },
  { id: 'J-FG-CRUD001', cat: 'CRUD-Create', obj: 'สร้างของแถมใหม่ ผ่าน UI', desc: '1. เปิด list | 2. คลิก เพิ่มของแถม | 3. กรอกชื่อ TH unique | 4. บันทึก', data: '-', exp: "Toast + redirect ไป list + พบ" },
  { id: 'J-FG-CRUD002', cat: 'CRUD-Verify', obj: 'ค้นหา record', desc: '1. พิมพ์ในค้นหา', data: '-', exp: 'พบ' },
  { id: 'J-FG-CRUD010', cat: 'CRUD-Edit', obj: 'เปิด Edit + แก้ชื่อ', desc: '1. คลิกดินสอ + แก้ + บันทึก', data: '-', exp: 'อัพเดต' },
  { id: 'J-FG-CRUD011', cat: 'CRUD-Verify', obj: 'verify ชื่อใหม่', desc: '1. ค้นหา', data: '-', exp: 'พบ' },
  { id: 'J-FG-CRUD020', cat: 'CRUD-Delete', obj: 'เปิด menu → ลบ → ยกเลิก', desc: '1. menu → ลบ → ยกเลิก', data: '-', exp: 'dialog ปิด record ยังอยู่' },
  { id: 'J-FG-CRUD021', cat: 'CRUD-Delete', obj: 'ลบ → ยืนยัน', desc: '1. menu → ลบ → ยืนยัน', data: '-', exp: 'หาย' },
  { id: 'J-FG-CRUD022', cat: 'CRUD-Verify', obj: 'verify หาย', desc: '1. ค้นหา', data: '-', exp: 'ไม่พบ' },

  { type: 'part', text: 'PART 4: หน้า Edit (เพิ่มเติม)' },
  { id: 'J-FG-ED001', cat: 'Edit-Open', obj: 'Invalid ID', desc: '1. /update/99999999', data: '-', exp: '404 / redirect' },

  { type: 'part', text: 'PART 5: UI/UX + Security' },
  { id: 'J-FG-UX001', cat: 'Responsive', obj: 'Desktop 1920', desc: '1. เปิด', data: '-', exp: 'Layout ปกติ' },
  { id: 'J-FG-UX002', cat: 'Responsive', obj: 'Tablet/Mobile', desc: '1. ปรับ', data: '-', exp: 'Responsive' },
  { id: 'J-FG-UX003', cat: 'Browser-Chrome', obj: 'Chrome', desc: '1. เปิด', data: '-', exp: 'ทำงาน' },
  { id: 'J-FG-UX004', cat: 'Browser-Other', obj: 'Firefox/Safari/Edge', desc: '1. test', data: '-', exp: 'ทำงาน' },
  { id: 'J-FG-SEC001', cat: 'Permission-NoLogin', obj: 'ไม่ login', desc: '1. logout', data: '-', exp: 'redirect' },
  { id: 'J-FG-SEC002', cat: 'XSS-Display', obj: 'XSS display', desc: '1. ดู list', data: '-', exp: 'text' },
  { id: 'J-FG-SEC003', cat: 'CSRF', obj: 'CSRF', desc: '1. ตรวจ', data: '-', exp: 'มี token' },
]

function field(s) { if (s == null) return ''; s = String(s); if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`; return s }
const blank = ',,,,,,,'
const sectionRow = (text) => `${field(text)},,,,,,,`
const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
const lines = [
  `Project Name :,JIB-Ecommerce,,,Create Date :,2026-06-01,,`,
  `Project ID :,,,,Start Test Date :,2026-06-01,,`,
  `Tester Name :,admin zero,,,Finish Test Date :,2026-06-01,,`,
  `Project Release / Version :,1.0,,,Module / Function :,${field('ของแถม (Free Gifts) - List + Create + Edit + CRUD Cycle')},,`,
  `URL List :,https://devstorex.jibc.codelabdev.co/store/promotion-manager/free-gifts,,,,,,`,
  `URL Create :,https://devstorex.jibc.codelabdev.co/store/promotion-manager/free-gifts/create,,,,,,`,
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
lines.push(`,${field('2. ⭐ PART 3 CRUD: สร้าง record จริง → แก้ไขชื่อจริง → ลบจริง พร้อม verify')},,,,,,`)
lines.push(`,${field('3. ของแถม = แคมเปญที่มี sub-table ของแถม (gift items) + สินค้าที่เข้าร่วม - การสร้างขั้นต่ำต้องการชื่อ + อาจต้องการ rate range/item')},,,,,,`)

fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log('freegifts:', sum, '| pass rate:', passRate + '%')
