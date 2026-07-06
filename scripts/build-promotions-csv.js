/** Build JIB_TestCases_Promotions_Full.csv */
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '../JIB_TestCases_Promotions_Full.csv')
let results = {}
try { results = JSON.parse(fs.readFileSync(path.join(__dirname, 'promotions-test-results.json'), 'utf8')) } catch {}

const ROWS = [
  { type: 'part', text: 'PART 1: หน้า List (รายการโปรโมชั่น)' },
  { type: 'sub', text: 'A. การโหลดหน้า + UI Elements' },
  { id: 'J-PRM-LP001', cat: 'Page Load', obj: 'เปิดหน้ารายการ', desc: '1. เข้า URL /store/promotion-manager/promotions', data: '-', exp: 'แสดงตารางโปรโมชั่น + controls ครบ' },
  { id: 'J-PRM-LP002', cat: 'UI', obj: 'Breadcrumb', desc: '1. ดู breadcrumb', data: '-', exp: 'มี "โปรโมชัน"' },
  { id: 'J-PRM-LP003', cat: 'UI', obj: 'Header + คำอธิบาย', desc: '1. ดูหัวข้อ', data: '-', exp: "'โปรโมชัน' + 'รายการโปรโมชันทั้งหมดในระบบ'" },
  { id: 'J-PRM-LP004', cat: 'UI', obj: 'คอลัมน์ตาราง', desc: '1. ดู thead', data: '-', exp: 'มี ชื่อโปรโมชัน, ประเภท, สถานะ, วันที่เริ่ม/สิ้นสุด, จัดการ' },
  { id: 'J-PRM-LP005', cat: 'UI', obj: 'Action Bar', desc: '1. ดู toolbar', data: '-', exp: 'ค้นหา, ตัวกรอง, ปรับแต่งคอลัมน์, เพิ่มโปรโมชัน' },
  { type: 'sub', text: 'B. การค้นหา' },
  { id: 'J-PRM-LP010', cat: 'Search', obj: 'ค้นหาภาษาไทย', desc: '1. พิมพ์ keyword TH', data: '-', exp: 'กรอง + URL ?search=' },
  { id: 'J-PRM-LP011', cat: 'Search', obj: 'ค้นหาที่ไม่มี', desc: '1. พิมพ์คำที่ไม่มี', data: '-', exp: "empty state" },
  { id: 'J-PRM-LP012', cat: 'Search', obj: 'อักขระพิเศษ', desc: "1. พิมพ์ '@#$%'", data: '-', exp: 'ไม่ error' },
  { id: 'J-PRM-LP013', cat: 'Search', obj: 'XSS', desc: "1. '<script>'", data: '-', exp: 'รับเป็น text' },
  { id: 'J-PRM-LP014', cat: 'Search', obj: 'เคลียร์ search', desc: '1. ลบคำ', data: '-', exp: 'list กลับมา' },
  { type: 'sub', text: 'C. ตัวกรอง + ปรับแต่งคอลัมน์' },
  { id: 'J-PRM-LP020', cat: 'Filter', obj: "ปุ่ม 'ตัวกรอง' เปิด sheet", desc: '1. คลิก', data: '-', exp: 'sheet เปิด' },
  { id: 'J-PRM-LP021', cat: 'Filter', obj: 'ESC ปิด sheet', desc: '1. ESC', data: '-', exp: 'ปิด' },
  { id: 'J-PRM-LP022', cat: 'Customize', obj: 'เปิด ปรับแต่งคอลัมน์', desc: '1. คลิก', data: '-', exp: 'menu เปิด' },
  { id: 'J-PRM-LP023', cat: 'Customize', obj: "ซ่อน 'ผู้สร้าง'", desc: '1. uncheck', data: '-', exp: 'คอลัมน์หาย' },
  { id: 'J-PRM-LP024', cat: 'Customize', obj: 'เปิดกลับ', desc: '1. check', data: '-', exp: 'กลับมา' },
  { type: 'sub', text: 'D. จำนวนแถว + Pagination' },
  { id: 'J-PRM-LP030', cat: 'Rows', obj: 'ดู options', desc: '1. คลิก combobox', data: '-', exp: '10/20/50/100' },
  { id: 'J-PRM-LP031', cat: 'Rows', obj: 'เลือก 20', desc: '1. เลือก 20', data: '-', exp: '≤ 20 row' },
  { id: 'J-PRM-LP032', cat: 'Pagination', obj: 'Default ≤ 10', desc: '1. ดูตาราง', data: '-', exp: '≤ 10 row' },
  { id: 'J-PRM-LP033', cat: 'Pagination', obj: 'Footer format', desc: '1. ดู footer', data: '-', exp: "'X - Y จาก Z รายการ'" },
  { type: 'sub', text: 'E. Row Actions + Status toggle' },
  { id: 'J-PRM-LP040', cat: 'Row', obj: 'ปุ่ม Edit (ดินสอ)', desc: '1. คลิก', data: '-', exp: '/promotions/update/{id}' },
  { id: 'J-PRM-LP041', cat: 'Row', obj: '3-dot menu', desc: '1. คลิก', data: '-', exp: "menu items" },
  { id: 'J-PRM-LP042', cat: 'Row', obj: 'Status toggle ในแถว', desc: '1. ดู switches inline', data: '-', exp: 'มี switches' },
  { type: 'sub', text: "F. ปุ่ม 'เพิ่มโปรโมชัน'" },
  { id: 'J-PRM-LP050', cat: 'Add', obj: "คลิก 'เพิ่มโปรโมชัน'", desc: '1. คลิก', data: '-', exp: 'เปิด dialog "เลือกรูปแบบแคมเปญสินค้า"' },
  { id: 'J-PRM-LP051', cat: 'Add', obj: 'Dialog campaign type', desc: '1. ดู dialog', data: '-', exp: 'มีตัวเลือกประเภท (Discount, etc.)' },
  { id: 'J-PRM-LP052', cat: 'Add', obj: "เลือก 'ส่วนลด' + ยืนยัน", desc: '1. เลือก + ยืนยัน', data: '-', exp: '/promotions/create' },
  { id: 'J-PRM-LP053', cat: 'Add', obj: 'ยกเลิก dialog', desc: '1. ESC', data: '-', exp: 'ปิด ไม่ navigate' },

  { type: 'part', text: 'PART 2: หน้า Create' },
  { type: 'sub', text: 'G. Default state + ฟิลด์หลัก' },
  { id: 'J-PRM-CR001', cat: 'UI', obj: 'Header', desc: '1. ดูหัวข้อ', data: '-', exp: "'เพิ่มแคมเปญโปรโมชั่น'" },
  { id: 'J-PRM-CR002', cat: 'UI', obj: 'TH/EN name fields', desc: '1. ดูฟิลด์', data: '-', exp: 'translations.0/1.name visible' },
  { id: 'J-PRM-CR003', cat: 'UI', obj: 'Default sync toggle', desc: '1. ดู toggle', data: '-', exp: 'checked default' },
  { id: 'J-PRM-CR004', cat: 'UI', obj: 'TH/EN description', desc: '1. ดู textarea', data: '-', exp: 'translations.0/1.description visible' },
  { id: 'J-PRM-CR005', cat: 'NameTH', obj: 'กรอกชื่อ TH', desc: "1. กรอก", data: '-', exp: 'รับค่าได้' },
  { id: 'J-PRM-CR006', cat: 'NameTH', obj: 'TH ยาว 255', desc: '1. กรอก 255 ตัว', data: '-', exp: 'รับ' },
  { id: 'J-PRM-CR007', cat: 'NameTH', obj: 'TH ยาวเกิน 256', desc: '1. กรอก 300', data: '-', exp: 'block/warning' },
  { id: 'J-PRM-CR008', cat: 'NameTH', obj: 'space-only', desc: '1. กรอก spaces', data: '-', exp: 'validate trim' },
  { id: 'J-PRM-CR009', cat: 'NameTH', obj: 'XSS', desc: '1. <script>', data: '-', exp: 'รับเป็น text' },
  { id: 'J-PRM-CR010', cat: 'NameTH', obj: 'Empty + save', desc: '1. ไม่กรอก + save', data: '-', exp: 'error required' },
  { id: 'J-PRM-CR011', cat: 'SyncToggle', obj: 'ปิด toggle → EN unlock', desc: '1. คลิก toggle', data: '-', exp: 'EN editable' },
  { id: 'J-PRM-CR012', cat: 'DescTH', obj: 'กรอกรายละเอียด TH', desc: '1. กรอก', data: '-', exp: 'รับค่าได้' },
  { id: 'J-PRM-CR013', cat: 'DescTH', obj: 'multi-line', desc: '1. newline', data: '-', exp: 'รับได้' },

  { type: 'part', text: '⭐ PART 3: CRUD Cycle — สร้าง / แก้ไข / ลบ จริงทั้งหมด' },
  { type: 'sub', text: 'H. Create → verify in list' },
  { id: 'J-PRM-CRUD001', cat: 'CRUD-Create', obj: 'สร้าง promotion ใหม่ (Discount) ผ่าน UI', desc: '1. เปิด list | 2. เพิ่มโปรโมชัน → เลือก ส่วนลด → ยืนยัน | 3. กรอกชื่อ TH unique | 4. คลิกบันทึก', data: 'name: เทสโปรโมชั่น CRUD {timestamp}', exp: "Toast 'สำเร็จ' + redirect ไป list + record ปรากฏ" },
  { id: 'J-PRM-CRUD002', cat: 'CRUD-Verify', obj: 'ค้นหา record ที่เพิ่งสร้าง', desc: '1. พิมพ์ชื่อในค้นหา', data: '-', exp: 'พบ record ในตาราง' },
  { type: 'sub', text: 'I. Edit → verify changes' },
  { id: 'J-PRM-CRUD010', cat: 'CRUD-Edit', obj: 'เปิด Edit ของ record ที่สร้าง', desc: '1. คลิกดินสอ', data: '-', exp: '/promotions/update/{id} โหลดข้อมูลครบ' },
  { id: 'J-PRM-CRUD011', cat: 'CRUD-Edit', obj: 'แก้ชื่อ + บันทึก', desc: '1. แก้ชื่อเป็น "(Edited)" + บันทึก', data: '-', exp: 'Toast สำเร็จ + ตารางอัพเดต' },
  { id: 'J-PRM-CRUD012', cat: 'CRUD-Verify', obj: 'ค้นหาด้วยชื่อใหม่', desc: '1. พิมพ์ชื่อใหม่', data: '-', exp: 'พบ record ที่อัพเดต' },
  { type: 'sub', text: 'J. Delete → verify removed (cleanup)' },
  { id: 'J-PRM-CRUD020', cat: 'CRUD-Delete', obj: 'เปิด 3-dot menu บนแถว', desc: '1. คลิก 3 จุด', data: '-', exp: 'menu items มี "ลบ"' },
  { id: 'J-PRM-CRUD021', cat: 'CRUD-Delete', obj: "คลิก 'ลบ' → dialog ยืนยัน", desc: '1. menu → ลบ', data: '-', exp: 'confirm dialog' },
  { id: 'J-PRM-CRUD022', cat: 'CRUD-Delete', obj: 'ยกเลิก dialog', desc: '1. ยกเลิก', data: '-', exp: 'dialog ปิด record ยังอยู่' },
  { id: 'J-PRM-CRUD023', cat: 'CRUD-Delete', obj: 'ยืนยันลบ', desc: '1. คลิก ลบ/ยืนยัน', data: '-', exp: "Toast สำเร็จ + record หาย" },
  { id: 'J-PRM-CRUD024', cat: 'CRUD-Verify', obj: 'ค้นหายืนยันว่าหาย', desc: '1. พิมพ์ชื่อในค้นหา', data: '-', exp: 'ไม่พบ / empty state' },

  { type: 'part', text: 'PART 4: หน้า Edit (เพิ่มเติม)' },
  { id: 'J-PRM-ED001', cat: 'Edit-Open', obj: 'Invalid ID', desc: '1. /update/99999999', data: '-', exp: '404 / redirect' },
  { id: 'J-PRM-ED002', cat: 'Edit-Cancel', obj: 'แก้ไขแล้วยกเลิก (visit list)', desc: '1. แก้ + visit list', data: '-', exp: 'ค่าเดิมไม่เปลี่ยน' },
  { id: 'J-PRM-ED003', cat: 'Edit-Open', obj: 'Header แก้ไข', desc: '1. ดูหัวข้อ', data: '-', exp: 'มี "แก้ไข"' },

  { type: 'part', text: 'PART 5: UI/UX + Security' },
  { id: 'J-PRM-UX001', cat: 'Responsive', obj: 'Desktop 1920', desc: '1. เปิด 1920', data: '-', exp: 'Layout ปกติ' },
  { id: 'J-PRM-UX002', cat: 'Responsive', obj: 'Tablet 768', desc: '1. 768px', data: '-', exp: 'Responsive' },
  { id: 'J-PRM-UX003', cat: 'Responsive', obj: 'Mobile 375', desc: '1. 375px', data: '-', exp: 'Responsive' },
  { id: 'J-PRM-UX004', cat: 'Browser-Chrome', obj: 'Chrome', desc: '1. Chrome', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-PRM-UX005', cat: 'Browser-Firefox', obj: 'Firefox', desc: '1. Firefox', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-PRM-UX006', cat: 'Browser-Safari', obj: 'Safari', desc: '1. Safari', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-PRM-SEC001', cat: 'Permission-NoLogin', obj: 'ไม่ login', desc: '1. logout + URL', data: '-', exp: 'redirect login' },
  { id: 'J-PRM-SEC002', cat: 'XSS-Display', obj: 'XSS display', desc: '1. สร้างชื่อ <script>', data: '-', exp: 'แสดงเป็น text' },
  { id: 'J-PRM-SEC003', cat: 'CSRF', obj: 'CSRF token', desc: '1. ตรวจ request', data: '-', exp: 'มี token' },
]

function field(s) { if (s == null) return ''; s = String(s); if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`; return s }
const blank = ',,,,,,,'
const sectionRow = (text) => `${field(text)},,,,,,,`

const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
const lines = [
  `Project Name :,JIB-Ecommerce,,,Create Date :,2026-06-01,,`,
  `Project ID :,,,,Start Test Date :,2026-06-01,,`,
  `Tester Name :,admin zero,,,Finish Test Date :,2026-06-01,,`,
  `Project Release / Version :,1.0,,,Module / Function :,${field('โปรโมชั่น (Promotions) - List + Create + Edit + Full CRUD Cycle')},,`,
  `URL List :,https://devstorex.jibc.codelabdev.co/store/promotion-manager/promotions,,,,,,`,
  `URL Create :,https://devstorex.jibc.codelabdev.co/store/promotion-manager/promotions/create,,,,,,`,
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
lines.push(`Notes :,${field('1. ทดสอบบน Chromium (Chrome for Testing 127) ผ่าน Puppeteer')},,,,,,`)
lines.push(`,${field('2. ⭐ PART 3 CRUD Cycle: สร้าง record จริง → แก้ไขจริง → ลบจริง พร้อม cleanup')},,,,,,`)
lines.push(`,${field('3. เพิ่มโปรโมชันต้องเลือกประเภทแคมเปญใน dialog ก่อน (เลือก ส่วนลด/Discount) แล้วจึงเข้าหน้า create')},,,,,,`)
lines.push(`,${field('4. Sections "-- ... --" ใช้ตัวคั่นมาตรฐาน (ไม่ใช้ #/=) ตามรูปแบบ test case JIB')},,,,,,`)

fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log('promotions:', sum, '| pass rate:', passRate + '%')
