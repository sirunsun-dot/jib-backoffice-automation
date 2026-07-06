/** Build JIB_TestCases_Coupons_Full.csv */
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '../JIB_TestCases_Coupons_Full.csv')
let results = {}
try { results = JSON.parse(fs.readFileSync(path.join(__dirname, 'coupons-test-results.json'), 'utf8')) } catch {}

const ROWS = [
  { type: 'part', text: 'PART 1: หน้า List (รายการคูปอง)' },
  { type: 'sub', text: 'A. การโหลดหน้า + UI Elements' },
  { id: 'J-CPN-LP001', cat: 'Page Load', obj: 'เปิดหน้ารายการ', desc: '1. /coupons', data: '-', exp: 'ตาราง + controls' },
  { id: 'J-CPN-LP002', cat: 'UI', obj: 'Header + คำอธิบาย', desc: '1. ดู', data: '-', exp: "'คูปอง' + 'รายการคูปองทั้งหมดในระบบ'" },
  { id: 'J-CPN-LP003', cat: 'UI', obj: 'คอลัมน์ตาราง', desc: '1. ดู', data: '-', exp: 'ชื่อคูปอง, รายการคูปอง, วันที่เริ่ม/สิ้นสุด, สถานะ, จัดการ' },
  { id: 'J-CPN-LP004', cat: 'UI', obj: 'Action Bar', desc: '1. ดู', data: '-', exp: 'ค้นหาชื่อคูปอง, ตัวกรอง, ปรับแต่งคอลัมน์, เพิ่มคูปอง' },
  { type: 'sub', text: 'B. การค้นหา' },
  { id: 'J-CPN-LP010', cat: 'Search', obj: 'ค้นหา TH', desc: '1. พิมพ์', data: '-', exp: 'กรอง' },
  { id: 'J-CPN-LP011', cat: 'Search', obj: 'ไม่มี keyword', desc: '1. พิมพ์ไม่มี', data: '-', exp: 'empty state' },
  { id: 'J-CPN-LP012', cat: 'Search', obj: 'XSS', desc: '1. <script>', data: '-', exp: 'เป็น text' },
  { id: 'J-CPN-LP013', cat: 'Search', obj: 'เคลียร์', desc: '1. ลบ', data: '-', exp: 'กลับมา' },
  { type: 'sub', text: 'C. ตัวกรอง + ปรับแต่งคอลัมน์' },
  { id: 'J-CPN-LP020', cat: 'Filter', obj: 'ปุ่ม ตัวกรอง', desc: '1. คลิก', data: '-', exp: 'sheet เปิด' },
  { id: 'J-CPN-LP021', cat: 'Filter', obj: 'ESC ปิด', desc: '1. ESC', data: '-', exp: 'ปิด' },
  { id: 'J-CPN-LP022', cat: 'Customize', obj: 'เปิด menu', desc: '1. คลิก', data: '-', exp: 'menu' },
  { id: 'J-CPN-LP023', cat: 'Customize', obj: 'ซ่อนคอลัมน์', desc: '1. uncheck', data: '-', exp: 'หาย' },
  { id: 'J-CPN-LP024', cat: 'Customize', obj: 'เปิดกลับ', desc: '1. check', data: '-', exp: 'กลับมา' },
  { type: 'sub', text: 'D. จำนวนแถว + Pagination' },
  { id: 'J-CPN-LP030', cat: 'Rows', obj: 'ดู options', desc: '1. คลิก', data: '-', exp: '10/20/50/100' },
  { id: 'J-CPN-LP031', cat: 'Rows', obj: 'เลือก 20', desc: '1. เลือก', data: '-', exp: '≤ 20' },
  { id: 'J-CPN-LP032', cat: 'Pagination', obj: 'Default ≤ 10', desc: '1. ดู', data: '-', exp: '≤ 10' },
  { id: 'J-CPN-LP033', cat: 'Pagination', obj: 'Footer format', desc: '1. ดู', data: '-', exp: "'X - Y จาก Z'" },
  { type: 'sub', text: 'E. Row Actions' },
  { id: 'J-CPN-LP040', cat: 'Row', obj: 'ปุ่ม Edit', desc: '1. คลิก', data: '-', exp: '/coupons/update/{id}' },
  { id: 'J-CPN-LP041', cat: 'Row', obj: '3-dot menu', desc: '1. คลิก', data: '-', exp: 'menu items' },
  { type: 'sub', text: "F. ปุ่ม 'เพิ่มคูปอง'" },
  { id: 'J-CPN-LP050', cat: 'Add', obj: 'คลิก', desc: '1. คลิก', data: '-', exp: '/coupons/create' },

  { type: 'part', text: 'PART 2: หน้า Create — Parent (แคมเปญคูปอง)' },
  { type: 'sub', text: 'G. Header + Default state' },
  { id: 'J-CPN-CR001', cat: 'UI', obj: 'Header', desc: '1. ดู', data: '-', exp: "'เพิ่มแคมเปญคูปอง'" },
  { id: 'J-CPN-CR002', cat: 'UI', obj: 'TH/EN fields', desc: '1. ดู', data: '-', exp: 'translations.0/1.name' },
  { id: 'J-CPN-CR003', cat: 'UI', obj: 'Sync toggle default ON', desc: '1. ดู', data: '-', exp: 'checked' },
  { id: 'J-CPN-CR004', cat: 'UI', obj: 'Status default = กำลังเปิดใช้งาน', desc: '1. ดู', data: '-', exp: 'checked' },
  { id: 'J-CPN-CR005', cat: 'UI', obj: 'Radio ระยะเวลาแคมเปญ', desc: '1. ดู', data: '-', exp: 'ระบุระยะเวลา (default) / ไม่มีวันหมดอายุ' },
  { id: 'J-CPN-CR006', cat: 'UI', obj: 'Empty state รายการคูปอง', desc: '1. ดู', data: '-', exp: "'ยังไม่มีรายการคูปอง' + 'กด เพิ่มรายการคูปอง'" },
  { id: 'J-CPN-CR007', cat: 'UI', obj: 'ปุ่ม เพิ่มรายการคูปอง', desc: '1. ดู', data: '-', exp: 'มี' },
  { type: 'sub', text: 'H. กรอกชื่อ + radio + sync' },
  { id: 'J-CPN-CR010', cat: 'NameTH', obj: 'กรอก TH', desc: '1. กรอก', data: '-', exp: 'รับ' },
  { id: 'J-CPN-CR011', cat: 'NameTH', obj: 'TH ยาว 255', desc: '1. 255', data: '-', exp: 'รับ' },
  { id: 'J-CPN-CR012', cat: 'NameTH', obj: 'TH ยาว 300', desc: '1. 300', data: '-', exp: 'block/warning' },
  { id: 'J-CPN-CR013', cat: 'NameTH', obj: 'XSS', desc: '1. <script>', data: '-', exp: 'เป็น text' },
  { id: 'J-CPN-CR014', cat: 'NameTH', obj: 'Empty + save', desc: '1. ไม่กรอก + save', data: '-', exp: 'error required' },
  { id: 'J-CPN-CR015', cat: 'SyncToggle', obj: 'ปิด sync → EN unlock', desc: '1. คลิก', data: '-', exp: 'EN editable' },
  { id: 'J-CPN-CR016', cat: 'Radio', obj: "เลือก 'ไม่มีวันหมดอายุ'", desc: '1. คลิก radio', data: '-', exp: 'radio update' },
  { type: 'sub', text: "I. Dialog 'เพิ่มรายการคูปอง'" },
  { id: 'J-CPN-CR020', cat: 'Dialog', obj: "คลิก 'เพิ่มรายการคูปอง'", desc: '1. คลิก', data: '-', exp: 'dialog เปิด' },
  { id: 'J-CPN-CR021', cat: 'Dialog', obj: 'ฟิลด์ใน dialog', desc: '1. ดู', data: '-', exp: 'ชื่อรายการ, รูปแบบส่วนลด, มูลค่า, รหัสคูปอง, ฯลฯ' },
  { id: 'J-CPN-CR022', cat: 'Dialog', obj: 'ยืนยัน empty → error', desc: '1. ยืนยันโดยไม่กรอก', data: '-', exp: "'กรุณากรอกรหัสคูปอง'" },
  { id: 'J-CPN-CR023', cat: 'Dialog', obj: '% ส่วนลด > 100', desc: '1. กรอก 150 + ยืนยัน', data: '-', exp: "error '0 ถึง 100'" },
  { id: 'J-CPN-CR024', cat: 'Dialog', obj: "สลับ 'สร้างรหัสอัตโนมัติ'", desc: '1. คลิก radio', data: '-', exp: '3 ฟิลด์ใหม่ (คำนำหน้า/ความยาว/ชุดอักขระ)' },
  { id: 'J-CPN-CR025', cat: 'Dialog', obj: "สลับ 'เลือกเฉพาะสินค้า'", desc: '1. คลิก radio', data: '-', exp: 'product picker' },
  { id: 'J-CPN-CR026', cat: 'Dialog', obj: 'ยกเลิก dialog', desc: '1. ยกเลิก', data: '-', exp: 'dialog ปิด' },
  { id: 'J-CPN-CR027', cat: 'Dialog', obj: 'กรอกครบ + ยืนยัน', desc: '1. กรอก + ยืนยัน', data: '-', exp: 'item เพิ่มในตาราง' },

  { type: 'part', text: '⭐ PART 3: CRUD Cycle (สร้าง→แก้→ลบจริง) — Full Flow' },
  { id: 'J-CPN-CRUD001', cat: 'CRUD-Create', obj: 'สร้างแคมเปญคูปอง + 1 รายการคูปอง ผ่าน UI', desc: '1. เปิด /create | 2. กรอกชื่อ | 3. ไม่มีวันหมดอายุ | 4. เพิ่มรายการคูปอง (ดู dialog) → กรอกชื่อ + มูลค่า + รหัส → ยืนยัน | 5. บันทึก', data: '-', exp: 'Toast + redirect ไป list + พบ record' },
  { id: 'J-CPN-CRUD002', cat: 'CRUD-Verify', obj: 'ค้นหา record', desc: '1. พิมพ์', data: '-', exp: 'พบ' },
  { id: 'J-CPN-CRUD010', cat: 'CRUD-Edit', obj: 'เปิด Edit + แก้ชื่อ', desc: '1. ดินสอ + แก้ + save', data: '-', exp: 'อัพเดต' },
  { id: 'J-CPN-CRUD011', cat: 'CRUD-Verify', obj: 'verify ชื่อใหม่', desc: '1. ค้นหา', data: '-', exp: 'พบ' },
  { id: 'J-CPN-CRUD020', cat: 'CRUD-Delete', obj: 'เปิด menu → ลบ → ยกเลิก', desc: '1. menu → ลบ → ยกเลิก', data: '-', exp: 'ปิด dialog ยังอยู่' },
  { id: 'J-CPN-CRUD021', cat: 'CRUD-Delete', obj: 'ลบ → ยืนยัน', desc: '1. ยืนยัน', data: '-', exp: 'หาย' },
  { id: 'J-CPN-CRUD022', cat: 'CRUD-Verify', obj: 'verify หาย', desc: '1. ค้นหา', data: '-', exp: 'ไม่พบ' },

  { type: 'part', text: 'PART 4: หน้า Edit (เพิ่มเติม)' },
  { id: 'J-CPN-ED001', cat: 'Edit-Open', obj: 'Invalid ID', desc: '1. /update/99999999', data: '-', exp: '404 / redirect' },
  { id: 'J-CPN-ED002', cat: 'Edit-Open', obj: 'Header แก้ไข + ID + บันทึกล่าสุด', desc: '1. ดู', data: '-', exp: 'มี ID + บันทึกล่าสุด' },

  { type: 'part', text: 'PART 5: UI/UX + Security' },
  { id: 'J-CPN-UX001', cat: 'Responsive', obj: 'Desktop 1920', desc: '1. เปิด', data: '-', exp: 'Layout ปกติ' },
  { id: 'J-CPN-UX002', cat: 'Responsive', obj: 'Tablet/Mobile', desc: '1. ปรับ', data: '-', exp: 'Responsive' },
  { id: 'J-CPN-UX003', cat: 'Browser-Chrome', obj: 'Chrome', desc: '1. เปิด', data: '-', exp: 'ทำงาน' },
  { id: 'J-CPN-UX004', cat: 'Browser-Other', obj: 'Firefox/Safari/Edge', desc: '1. test', data: '-', exp: 'ทำงาน' },
  { id: 'J-CPN-SEC001', cat: 'Permission-NoLogin', obj: 'ไม่ login', desc: '1. logout', data: '-', exp: 'redirect' },
  { id: 'J-CPN-SEC002', cat: 'XSS-Display', obj: 'XSS display', desc: '1. ดู list', data: '-', exp: 'text' },
  { id: 'J-CPN-SEC003', cat: 'CSRF', obj: 'CSRF', desc: '1. ตรวจ', data: '-', exp: 'มี token' },
]

function field(s) { if (s == null) return ''; s = String(s); if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`; return s }
const blank = ',,,,,,,'
const sectionRow = (text) => `${field(text)},,,,,,,`
const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
const lines = [
  `Project Name :,JIB-Ecommerce,,,Create Date :,2026-06-01,,`,
  `Project ID :,,,,Start Test Date :,2026-06-01,,`,
  `Tester Name :,admin zero,,,Finish Test Date :,2026-06-01,,`,
  `Project Release / Version :,1.0,,,Module / Function :,${field('คูปอง (Coupons) - List + Create + Item Dialog + Edit + CRUD Cycle')},,`,
  `URL List :,https://devstorex.jibc.codelabdev.co/store/promotion-manager/coupons,,,,,,`,
  `URL Create :,https://devstorex.jibc.codelabdev.co/store/promotion-manager/coupons/create,,,,,,`,
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
lines.push(`,${field('2. ⭐ PART 3 CRUD: สร้าง record จริง (parent + dialog item) → แก้ไขจริง → ลบจริง พร้อม verify cleanup')},,,,,,`)
lines.push(`,${field('3. คูปอง = แคมเปญ parent + Dialog เพิ่มรายการคูปอง (item) ที่มีรูปแบบส่วนลด/รหัส/ขอบเขตสินค้า — flow ที่ซับซ้อน')},,,,,,`)

fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log('coupons:', sum, '| pass rate:', passRate + '%')
