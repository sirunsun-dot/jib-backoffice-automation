/**
 * Build JIB_TestCases_InstallmentBanks_Full.csv + InstallmentProzero_Full.csv
 */
const fs = require('fs')
const path = require('path')

const field = (s) => {
  if (s == null) return ''
  s = String(s)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function loadResults(name) {
  const p = path.join(__dirname, `../testcases/results/${name}`)
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return {} }
}

function buildCsv(meta, rows, results) {
  const today = new Date().toISOString().slice(0, 10)
  const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
  const lines = [
    `Project Name :,JIB-Ecommerce,,,Create Date :,${today},,`,
    `Project ID :,,,,Start Test Date :,${today},,`,
    `Tester Name :,sirun.sun@codelabdev.co,,,Finish Test Date :,${today},,`,
    `Project Release / Version :,1.0,,,Module / Function :,${field(meta.module)},,`,
    `URL List :,${meta.listUrl},,,,,,`,
    meta.createUrl ? `URL Create :,${meta.createUrl},,,,,,` : `URL Create :,-,,,,,,`,
    ',,,,,,,',
    'Test Case ID,Category,Test case Objective,Test Description / Procedure,Test Data,Expected Result,Actual Result,Result (Pass/Fail)',
    ',,,,,,,',
  ]

  let currentPart = ''
  for (const row of rows) {
    if (row.part && row.part !== currentPart) {
      currentPart = row.part
      lines.push(`${field(`---- ${row.part} ----`)},,,,,,,`)
      lines.push(',,,,,,,')
    }
    if (row.sub) {
      lines.push(`${field(`-- ${row.sub} --`)},,,,,,,`)
      continue
    }
    const r = results[row.id] || {}
    const actual = r.actual || 'ยังไม่ได้รัน automated test'
    const result = r.result || 'Not Tested'
    sum[result] = (sum[result] || 0) + 1
    lines.push([row.id, row.cat, row.obj, row.desc, row.data || '-', row.exp, actual, result].map(field).join(','))
  }

  const total = rows.filter((r) => r.id).length
  lines.push(',,,,,,,')
  lines.push(`${field('-- สรุปผลทดสอบรวม (Summary) --')},,,,,,,`)
  lines.push(`Total Test Cases :,${total},,,,,,`)
  lines.push(`Pass :,${sum.Pass},,,Fail :,${sum.Fail},,`)
  lines.push(`Warning :,${sum.Warning},,,Not Tested :,${sum['Not Tested']},,`)
  return { content: lines.join('\n') + '\n', sum, total }
}

const BANK_ROWS = [
  { part: 'PART 1: หน้า List — จัดการธนาคาร' },
  { sub: 'A. การโหลดหน้า + UI' },
  { id: 'J-IBK-LP001', cat: 'Page Load', obj: 'เปิดหน้ารายการ', desc: '1. เข้า /store/installment/installment-banks', exp: 'หน้าโหลดสำเร็จ' },
  { id: 'J-IBK-LP002', cat: 'UI', obj: 'Heading', desc: '1. ดูหัวข้อหน้า', exp: 'แสดง heading เกี่ยวกับธนาคาร/ผู้ให้บริการ' },
  { id: 'J-IBK-LP003', cat: 'UI', obj: 'คอลัมน์ตาราง', desc: '1. ดู thead', exp: '#, ธนาคาร/ผู้ให้บริการ, อัตราดอกเบี้ย, สถานะ, ผู้แก้ไข, วันที่แก้ไข, จัดการ' },
  { id: 'J-IBK-LP004', cat: 'UI', obj: 'จำนวนแถว', desc: '1. นับ tbody tr', exp: 'มีธนาคารล่วงหน้า ≥ 4 (kbank, ktc, ktc_proud, kcc)' },
  { id: 'J-IBK-LP005', cat: 'UI', obj: 'Action bar', desc: '1. ดู toolbar', exp: 'ค้นหา, ตัวกรอง, ปรับแต่งคอลัมน์' },
  { id: 'J-IBK-LP006', cat: 'UI', obj: 'ไม่มีปุ่มเพิ่ม', desc: '1. ตรวจปุ่มสร้าง', exp: 'ไม่มี create — master data' },
  { id: 'J-IBK-LP007', cat: 'UI', obj: 'ข้อมูลธนาคาร', desc: '1. ดูแถวในตาราง', exp: 'แสดง code + อัตราดอกเบี้ย + สถานะ' },
  { sub: 'B. การค้นหา' },
  { id: 'J-IBK-LP010', cat: 'Search', obj: 'ค้นหา kbank', desc: '1. พิมพ์ kbank', exp: 'กรองพบ kbank' },
  { id: 'J-IBK-LP011', cat: 'Search', obj: 'คำไม่มี', desc: '1. พิมพ์คำสุ่ม', exp: 'empty state' },
  { id: 'J-IBK-LP012', cat: 'Search', obj: 'เคลียร์', desc: '1. ลบ keyword', exp: 'กลับ list เต็ม' },
  { sub: 'C. ตัวกรอง + คอลัมน์' },
  { id: 'J-IBK-LP020', cat: 'Filter', obj: 'เปิดตัวกรอง', desc: '1. คลิกตัวกรอง', exp: 'sheet เปิด' },
  { id: 'J-IBK-LP021', cat: 'Filter', obj: 'ESC ปิด', desc: '1. กด ESC', exp: 'sheet ปิด' },
  { id: 'J-IBK-LP030', cat: 'Customize', obj: 'ปรับแต่งคอลัมน์', desc: '1. คลิกปรับแต่งคอลัมน์', exp: 'menu เปิด' },
  { id: 'J-IBK-LP031', cat: 'Customize', obj: 'ปิด menu', desc: '1. ESC', exp: 'ปิดได้' },
  { sub: 'D. Pagination + Edit link' },
  { id: 'J-IBK-LP040', cat: 'Pagination', obj: 'Footer', desc: '1. ดู footer', exp: 'รูปแบบ X - Y จาก Z' },
  { id: 'J-IBK-LP050', cat: 'Row', obj: 'ลิงก์แก้ไข', desc: '1. ดูคอลัมน์จัดการ', exp: 'มี /installment-banks/update/{id}' },
  { id: 'J-IBK-LP060', cat: 'Negative', obj: 'ไม่มีหน้า Create', desc: '1. เข้า /create', exp: '404 หรือ redirect' },
  { part: 'PART 2: หน้า Edit' },
  { id: 'J-IBK-ED001', cat: 'Edit', obj: 'เปิดหน้าแก้ไข', desc: '1. คลิกแก้ไขจาก list', exp: 'แสดงฟอร์ม edit' },
  { id: 'J-IBK-ED002', cat: 'Edit', obj: 'รหัสระบบ (code)', desc: '1. ดู input code', exp: 'readonly — kbank/ktc/kcc/ktc_proud' },
  { id: 'J-IBK-ED003', cat: 'Edit', obj: 'ฟิลด์หลัก', desc: '1. ดูฟอร์ม', exp: 'ชื่อ TH/EN, ดอกเบี้ยบัตรเครดิต' },
  { id: 'J-IBK-ED004', cat: 'Edit', obj: 'Sync TH/EN', desc: '1. ดู toggle sync', exp: 'มี toggle ใช้เหมือนกันทั้ง 2 ภาษา' },
  { id: 'J-IBK-ED005', cat: 'Edit', obj: 'สถานะ', desc: '1. ดู switch สถานะ', exp: 'เปิด/ปิดใช้งานได้' },
  { id: 'J-IBK-ED006', cat: 'Edit', obj: 'โลโก้ธนาคาร', desc: '1. ดูส่วนอัปโหลด', exp: 'อัปโหลดไฟล์หรือแนบลิงก์' },
  { id: 'J-IBK-ED010', cat: 'Validation', obj: 'ดอกเบี้ยว่าง', desc: '1. ลบดอกเบี้ย + บันทึก', exp: 'แสดง validation error' },
  { id: 'J-IBK-ED020', cat: 'Save', obj: 'บันทึกแก้ไข', desc: '1. เปลี่ยนอัตราดอกเบี้ย + บันทึก', exp: 'redirect กลับ list + ค่าถูกบันทึก' },
  { id: 'J-IBK-ED021', cat: 'Save', obj: 'verify หลัง reopen', desc: '1. เปิด edit อีกครั้ง', exp: 'ค่าดอกเบี้ยตรงกับที่บันทึก' },
  { id: 'J-IBK-ED030', cat: 'Negative', obj: 'Invalid ID', desc: '1. เข้า /update/99999999', exp: '404 หรือข้อความไม่พบ' },
  { id: 'J-IBK-ED031', cat: 'Data', obj: 'ID mapping', desc: '1. เปรียบเทียบ id กับ code', exp: 'บันทึก mapping id→code (ลำดับ list ≠ id)' },
]

const PZ_ROWS = [
  { part: 'PART 1: หน้า List — โปรผ่อน 0%' },
  { sub: 'A. UI + Tabs' },
  { id: 'J-IPZ-LP001', cat: 'Page Load', obj: 'เปิดหน้ารายการ', desc: '1. เข้า /store/installment/installment-prozero', exp: 'หน้าโหลดสำเร็จ' },
  { id: 'J-IPZ-LP002', cat: 'UI', obj: 'Heading', desc: '1. ดูหัวข้อ', exp: 'โปรผ่อน 0%' },
  { id: 'J-IPZ-LP003', cat: 'UI', obj: 'Action bar', desc: '1. ดู toolbar', exp: 'ค้นหา, สถานะ, ระยะเวลาแคมเปญ, ตัวกรอง, CSV, เพิ่มโปร' },
  { id: 'J-IPZ-LP004', cat: 'UI', obj: 'ตารางข้อมูล', desc: '1. รอโหลด list', exp: 'แสดงแถวแคมเปญ (อาจ skeleton ก่อน)' },
  { id: 'J-IPZ-LP005', cat: 'UI', obj: 'คอลัมน์', desc: '1. ดู thead', exp: 'มีคอลัมน์ตาม design' },
  { id: 'J-IPZ-LP010', cat: 'Tabs', obj: 'ถังขยะ', desc: '1. คลิก tab ถังขยะ', exp: 'URL ?tab=trash' },
  { id: 'J-IPZ-LP011', cat: 'Tabs', obj: 'ทั้งหมด', desc: '1. กลับ tab ทั้งหมด', exp: 'กลับ list ปกติ' },
  { sub: 'B. Search + Filter' },
  { id: 'J-IPZ-LP020', cat: 'Search', obj: 'ค้นหา', desc: '1. พิมพ์ keyword', exp: 'URL มี search param' },
  { id: 'J-IPZ-LP021', cat: 'Search', obj: 'คำไม่มี', desc: '1. พิมพ์คำสุ่ม', exp: 'empty state' },
  { id: 'J-IPZ-LP022', cat: 'Search', obj: 'เคลียร์', desc: '1. ลบ keyword', exp: 'กลับ list เต็ม' },
  { id: 'J-IPZ-LP030', cat: 'Filter', obj: 'สถานะ', desc: '1. คลิก dropdown สถานะ', exp: 'เปิดได้' },
  { id: 'J-IPZ-LP031', cat: 'Filter', obj: 'ระยะเวลาแคมเปญ', desc: '1. คลิก filter วันที่', exp: 'calendar เปิด' },
  { id: 'J-IPZ-LP032', cat: 'Filter', obj: 'ตัวกรองรวม', desc: '1. คลิกตัวกรอง', exp: 'sheet เปิด' },
  { id: 'J-IPZ-LP033', cat: 'Customize', obj: 'ปรับแต่งคอลัมน์', desc: '1. คลิกปรับแต่งคอลัมน์', exp: 'menu เปิด' },
  { sub: 'C. CSV + Pagination' },
  { id: 'J-IPZ-LP040', cat: 'CSV', obj: 'ประวัติอัปโหลด', desc: '1. คลิกประวัติการอัปโหลด', exp: 'dialog แสดงประวัติ CSV' },
  { id: 'J-IPZ-LP041', cat: 'CSV', obj: 'ปุ่ม CSV', desc: '1. ดูปุ่ม CSV Template/อัปโหลด/จัดการ', exp: 'มีครบ 3 ปุ่ม' },
  { id: 'J-IPZ-LP050', cat: 'Pagination', obj: 'Footer', desc: '1. ดู footer', exp: 'X - Y จาก Z รายการ' },
  { id: 'J-IPZ-LP060', cat: 'Row', obj: 'Edit link', desc: '1. ดูแถว', exp: 'มีลิงก์ /update/{id}' },
  { id: 'J-IPZ-LP070', cat: 'Create', obj: 'ปุ่มเพิ่ม', desc: '1. คลิกเพิ่มโปรผ่อน 0%', exp: 'ไป /create' },
  { part: 'PART 2: หน้า Create' },
  { id: 'J-IPZ-CR001', cat: 'UI', obj: 'Header', desc: '1. เปิด create', exp: 'เพิ่มโปรผ่อน 0%' },
  { id: 'J-IPZ-CR002', cat: 'UI', obj: 'ระยะเวลาแคมเปญ', desc: '1. ดู section', exp: 'date range picker บังคับ' },
  { id: 'J-IPZ-CR003', cat: 'UI', obj: 'แผนผ่อนชำระ', desc: '1. ดู section', exp: 'ปุ่มเพิ่มแผน + เลือกธนาคาร + งวด' },
  { id: 'J-IPZ-CR004', cat: 'UI', obj: 'สินค้าที่ร่วมรายการ', desc: '1. ดู section', exp: 'เลือกสินค้าหรือกรอก SKU' },
  { id: 'J-IPZ-CR005', cat: 'Business', obj: 'กฎ 1:1', desc: '1. อ่านคำอธิบาย', exp: '1 โปรต่อ 1 สินค้า' },
  { id: 'J-IPZ-CR006', cat: 'UI', obj: 'สถานะ default', desc: '1. ดู toggle', exp: 'กำลังเปิดใช้งาน = on' },
  { id: 'J-IPZ-CR010', cat: 'Validation', obj: 'บันทึกว่าง', desc: '1. ไม่กรอก + บันทึก', exp: 'error วันเริ่ม/สิ้นสุด + แผนผ่อน' },
  { id: 'J-IPZ-CR011', cat: 'UI', obj: 'Date picker', desc: '1. คลิกระบุวันที่', exp: 'calendar dialog เปิด' },
  { id: 'J-IPZ-CR020', cat: 'Plan', obj: 'เพิ่มแผน', desc: '1. คลิกเพิ่มแผน', exp: 'แถวธนาคาร+งวด' },
  { id: 'J-IPZ-CR021', cat: 'Plan', obj: 'เลือกธนาคาร', desc: '1. เปิด combobox', exp: 'ดึงจาก installment-banks (KBANK,KTC,...)' },
  { id: 'J-IPZ-CR022', cat: 'Plan', obj: 'จำนวนงวด', desc: '1. กรอกเช่น 6', exp: 'รับค่าตัวเลข' },
  { id: 'J-IPZ-CR030', cat: 'Product', obj: 'เพิ่มด้วย SKU', desc: '1. กรอก SKU + เพิ่ม', exp: 'สินค้าปรากฏในตาราง' },
  { id: 'J-IPZ-CR031', cat: 'Product', obj: 'Dialog เลือกสินค้า', desc: '1. คลิกเลือกสินค้า', exp: 'dialog รายการสินค้าทั้งหมด' },
  { id: 'J-IPZ-CR032', cat: 'Product', obj: 'Filter ใน dialog', desc: '1. ดู filter', exp: 'หมวดหมู่, แบรนด์, สถานะ' },
  { id: 'J-IPZ-CR040', cat: 'E2E', obj: 'สร้างครบ + บันทึก', desc: '1. วันที่+แผน+สินค้า+บันทึก', exp: 'redirect list + record ใหม่' },
  { part: 'PART 2B: Create — เงื่อนไขครบ (Deep)' },
  { sub: 'A. Validation' },
  { id: 'J-IPZ-CC001', cat: 'Validation', obj: 'บันทึกว่างทั้งหมด', desc: '1. ไม่กรอกอะไร + บันทึก', exp: 'error วันเริ่ม/สิ้นสุด/แผน' },
  { id: 'J-IPZ-CC002', cat: 'Validation', obj: 'มีแค่วันที่', desc: '1. เลือกวันที่อย่างเดียว + บันทึก', exp: 'error แผน+สินค้า' },
  { id: 'J-IPZ-CC003', cat: 'Validation', obj: 'มีวันที่+แผน', desc: '1. ไม่มีสินค้า + บันทึก', exp: 'error สินค้า' },
  { id: 'J-IPZ-CC004', cat: 'Validation', obj: 'มีวันที่+สินค้า', desc: '1. ไม่มีแผน + บันทึก', exp: 'error แผน' },
  { id: 'J-IPZ-CC005', cat: 'Validation', obj: 'มีแผน+สินค้า', desc: '1. ไม่มีวันที่ + บันทึก', exp: 'error วันเริ่ม/สิ้นสุด' },
  { sub: 'B. Date picker' },
  { id: 'J-IPZ-CC010', cat: 'Date', obj: 'เลือกช่วง + ใช้งาน', desc: '1. เลือกวันเริ่ม-สิ้นสุด 2. กดใช้งาน', exp: 'dialog ปิด ไม่มี error วันที่' },
  { id: 'J-IPZ-CC011', cat: 'Date', obj: 'ล้างทั้งหมด', desc: '1. เปิด picker 2. ล้างทั้งหมด', exp: 'มีปุ่มล้างทั้งหมด' },
  { id: 'J-IPZ-CC012', cat: 'Date', obj: 'ยกเลิก', desc: '1. เปิด picker 2. กดยกเลิก', exp: 'dialog ปิด' },
  { sub: 'C. แผนผ่อน — ธนาคารต่างๆ' },
  { id: 'J-IPZ-CC020', cat: 'Plan', obj: 'KBANK 6 งวด', desc: '1. เลือกกสิกร + 6 งวด', exp: 'แผนที่ 1 ปรากฏ' },
  { id: 'J-IPZ-CC021', cat: 'Plan', obj: 'KTC 10 งวด', desc: '1. เลือก KTC + 10 งวด', exp: 'แผนที่ 1 ปรากฏ' },
  { id: 'J-IPZ-CC022', cat: 'Plan', obj: 'KTC Proud 12 งวด', desc: '1. เลือก KTC Proud + 12', exp: 'แผนที่ 1 ปรากฏ' },
  { id: 'J-IPZ-CC023', cat: 'Plan', obj: 'KCC 3 งวด', desc: '1. เลือก KCC + 3 งวด', exp: 'แผนที่ 1 ปรากฏ' },
  { id: 'J-IPZ-CC030', cat: 'Plan', obj: 'หลายแผน', desc: '1. KBANK 6 + KTC 10', exp: 'แผนที่ 1 และ 2' },
  { id: 'J-IPZ-CC031', cat: 'Plan', obj: 'ไม่เลือกธนาคาร', desc: '1. ข้ามธนาคาร + บันทึก', exp: 'validation / ไม่ save' },
  { id: 'J-IPZ-CC032', cat: 'Plan', obj: 'งวด = 0', desc: '1. กรอก 0 งวด + บันทึก', exp: 'ไม่ save / error' },
  { id: 'J-IPZ-CC033', cat: 'Plan', obj: 'งวดเป็นตัวอักษร', desc: '1. กรอก abc + บันทึก', exp: 'ไม่ save / error' },
  { id: 'J-IPZ-CC034', cat: 'Plan', obj: 'งวดว่าง', desc: '1. ไม่กรอกงวด + บันทึก', exp: 'ไม่ save / error' },
  { sub: 'D. สินค้า' },
  { id: 'J-IPZ-CC040', cat: 'Product', obj: 'SKU ถูกต้อง', desc: '1. กรอก SKU จริง + เพิ่ม', exp: 'ปรากฏในตาราง' },
  { id: 'J-IPZ-CC041', cat: 'Product', obj: 'SKU ไม่มี', desc: '1. กรอก SKU ปลอม', exp: 'ไม่พบสินค้า / ไม่เพิ่ม' },
  { id: 'J-IPZ-CC042', cat: 'Product', obj: 'XSS ใน SKU', desc: "1. กรอก <script>", exp: 'ไม่ execute script' },
  { id: 'J-IPZ-CC043', cat: 'Product', obj: 'SKU ซ้ำ', desc: '1. เพิ่ม SKU เดิม 2 ครั้ง', exp: 'ยังคง 1 สินค้า (1:1)' },
  { id: 'J-IPZ-CC044', cat: 'Product', obj: 'เลือกจาก dialog', desc: '1. เปิด dialog 2. เลือกสินค้า', exp: 'dialog ทำงาน' },
  { sub: 'E. สถานะ + E2E Save' },
  { id: 'J-IPZ-CC050', cat: 'Status', obj: 'ปิดใช้งาน', desc: '1. toggle ปิด', exp: 'state=unchecked' },
  { id: 'J-IPZ-CC051', cat: 'Status', obj: 'เปิดใช้งาน', desc: '1. toggle เปิด', exp: 'state=checked' },
  { id: 'J-IPZ-CC060', cat: 'E2E', obj: 'KBANK+SKU บันทึก', desc: '1. ครบทุกฟิลด์ + บันทึก', exp: 'redirect list' },
  { id: 'J-IPZ-CC061', cat: 'E2E', obj: 'KTC+SKU บันทึก', desc: '1. KTC 10งวด + บันทึก', exp: 'redirect list' },
  { id: 'J-IPZ-CC062', cat: 'E2E', obj: 'สถานะปิด', desc: '1. ปิดสถานะ + บันทึก', exp: 'บันทึกได้' },
  { id: 'J-IPZ-CC063', cat: 'E2E', obj: '2 แผน', desc: '1. KBANK+KTC + บันทึก', exp: 'บันทึกได้' },
  { id: 'J-IPZ-CC070', cat: 'Cancel', obj: 'ออกไม่บันทึก', desc: '1. กรอกแล้ว navigate ออก', exp: 'ไม่สร้าง record' },
  { part: 'PART 3: หน้า Edit' },
  { id: 'J-IPZ-ED001', cat: 'Edit', obj: 'เปิด edit', desc: '1. คลิกแก้ไขจาก list', exp: 'ฟอร์มแคมเปญเดิม' },
  { id: 'J-IPZ-ED002', cat: 'Edit', obj: 'แผนผ่อน', desc: '1. ดูแผนเดิม', exp: 'แสดงธนาคาร+งวด' },
  { id: 'J-IPZ-ED003', cat: 'Edit', obj: 'สินค้า', desc: '1. ดูสินค้าที่ผูก', exp: 'แสดง SKU 1 รายการ' },
  { id: 'J-IPZ-ED004', cat: 'Edit', obj: 'บันทึก', desc: '1. มีปุ่มบันทึก', exp: 'บันทึกได้' },
  { id: 'J-IPZ-ED010', cat: 'Negative', obj: 'Invalid ID', desc: '1. /update/99999999', exp: '404 หรือไม่พบ' },
]

const bankRes = loadResults('ibank-test-results.json')
const pzRes = { ...loadResults('ipz-test-results.json'), ...loadResults('ipz-create-test-results.json') }

const bank = buildCsv({
  module: 'จัดการธนาคาร (Installment Banks)',
  listUrl: 'https://devstorex.jibc.codelabdev.co/store/installment/installment-banks',
}, BANK_ROWS, bankRes)

const pz = buildCsv({
  module: 'โปรผ่อน 0% (Installment Prozero)',
  listUrl: 'https://devstorex.jibc.codelabdev.co/store/installment/installment-prozero',
  createUrl: 'https://devstorex.jibc.codelabdev.co/store/installment/installment-prozero/create',
}, PZ_ROWS, pzRes)

const outDir = path.join(__dirname, '../testcases/csv')
fs.writeFileSync(path.join(outDir, 'JIB_TestCases_InstallmentBanks_Full.csv'), bank.content)
fs.writeFileSync(path.join(outDir, 'JIB_TestCases_InstallmentProzero_Full.csv'), pz.content)
console.log('Banks CSV:', bank.sum, 'total', bank.total)
console.log('Prozero CSV:', pz.sum, 'total', pz.total)
