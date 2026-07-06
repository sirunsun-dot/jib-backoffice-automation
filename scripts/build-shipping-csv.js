/**
 * Build JIB_TestCases_ShippingMethods_Full.csv
 * definitions + merger with overrides
 */
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '../JIB_TestCases_ShippingMethods_Full.csv')
const JSON_RES = path.join(__dirname, 'shipping-test-results.json')

let results = {}
try { results = JSON.parse(fs.readFileSync(JSON_RES, 'utf8')) } catch { results = {} }

const OVERRIDES = {
  'J-SHP-ED006': { actual: 'URL /update/99999999 → ไม่ redirect/404 (render Edit-like ฟอร์ม) - Bug pattern เดียวกับ tags, template-options, mapping-conditions, filters', result: 'Fail' },
}
for (const [k, v] of Object.entries(OVERRIDES)) results[k] = { ...(results[k] || {}), ...v }

const ROWS = [
  { type: 'part', text: 'PART 1: หน้า List (รายการวิธีการจัดส่ง)' },

  { type: 'sub', text: 'A. การโหลดหน้า + UI Elements' },
  { id: 'J-SHP-LP001', cat: 'Page Load', obj: 'เปิดหน้ารายการ', desc: '1. เข้า URL /store/product-manager/shipping-methods', data: '-', exp: 'แสดงตารางวิธีการจัดส่ง + controls ครบ' },
  { id: 'J-SHP-LP002', cat: 'UI', obj: 'Breadcrumb', desc: '1. ดู breadcrumb', data: '-', exp: 'ร้านค้า > จัดการสินค้า > วิธีการจัดส่ง' },
  { id: 'J-SHP-LP003', cat: 'UI', obj: 'Header + คำอธิบาย', desc: '1. ดูหัวข้อ', data: '-', exp: "'วิธีการจัดส่ง' + 'จัดการวิธีการจัดส่งสินค้า'" },
  { id: 'J-SHP-LP004', cat: 'UI', obj: 'คอลัมน์ในตาราง', desc: '1. ดูหัวคอลัมน์', data: '-', exp: '14 คอลัมน์: checkbox, #, ชื่อวิธีการจัดส่ง, ประเภท, ราคา, ผู้ให้บริการ, รูปแบบ, รายละเอียด, สถานะ, ผู้สร้าง, วันที่สร้าง, ผู้แก้ไขล่าสุด, วันที่แก้ไข, จัดการ' },
  { id: 'J-SHP-LP005', cat: 'UI', obj: 'Action Bar', desc: '1. ดู toolbar', data: '-', exp: 'ค้นหา, สถานะ, ประเภทการจัดส่ง, ประเภทสินค้าที่รองรับ, ตัวกรอง, ปรับแต่งคอลัมน์, เพิ่มวิธีการจัดส่ง' },
  { id: 'J-SHP-LP006', cat: 'UI', obj: 'Empty State', desc: '1. กรณีตารางว่าง', data: '-', exp: "'ไม่พบข้อมูล' / '0 - 0 จาก 0 รายการ'" },
  { id: 'J-SHP-LP007', cat: 'UI', obj: 'Loading state', desc: '1. เปิดหน้าใหม่', data: '-', exp: 'skeleton ระหว่าง fetch' },

  { type: 'sub', text: 'B. การค้นหา (Search)' },
  { id: 'J-SHP-LP010', cat: 'Search', obj: 'ค้นหาภาษาไทย', desc: '1. พิมพ์ keyword TH', data: 'Keyword: ไปรษณีย์', exp: 'กรอง record + อาจมี ?search=' },
  { id: 'J-SHP-LP011', cat: 'Search', obj: 'ค้นหาภาษาอังกฤษ', desc: '1. พิมพ์ keyword EN', data: 'Keyword: kerry', exp: 'กรอง + URL มี ?search=' },
  { id: 'J-SHP-LP012', cat: 'Search', obj: 'ค้นหาตัวเลข', desc: '1. พิมพ์ตัวเลข', data: 'Keyword: 100', exp: 'ไม่ error' },
  { id: 'J-SHP-LP013', cat: 'Search', obj: 'keyword ไม่มี', desc: '1. พิมพ์คำที่ไม่มี', data: '-', exp: "'ไม่พบข้อมูล' / '0 - 0 จาก 0'" },
  { id: 'J-SHP-LP014', cat: 'Search', obj: 'อักขระพิเศษ', desc: "1. พิมพ์ '@#$%'", data: '-', exp: 'ไม่ error / ไม่ SQL injection' },
  { id: 'J-SHP-LP015', cat: 'Search', obj: 'space-only', desc: "1. พิมพ์ '     '", data: '-', exp: 'ไม่ filter / list เต็ม' },
  { id: 'J-SHP-LP016', cat: 'Search', obj: 'เคลียร์ search', desc: '1. ลบคำในช่อง', data: '-', exp: 'กลับสู่ initial state' },
  { id: 'J-SHP-LP017', cat: 'Search', obj: 'Debounce', desc: '1. พิมพ์เร็วๆ ติดกัน', data: '-', exp: 'ไม่ยิง API ทุก keystroke' },
  { id: 'J-SHP-LP018', cat: 'Search', obj: 'XSS ใน search', desc: "1. พิมพ์ '<script>'", data: '-', exp: 'รับเป็น text' },

  { type: 'sub', text: 'C. ตัวกรองสถานะ (Status Dropdown)' },
  { id: 'J-SHP-LP020', cat: 'Filter-Status', obj: 'เปิด dropdown สถานะ', desc: "1. คลิก combobox 'สถานะ'", data: '-', exp: 'dropdown เปิด' },
  { id: 'J-SHP-LP021', cat: 'Filter-Status', obj: 'ตัวเลือก 3 ค่า', desc: '1. ดู options', data: '-', exp: "ทั้งหมด, เปิดใช้งาน, ปิดใช้งาน" },
  { id: 'J-SHP-LP022', cat: 'Filter-Status', obj: "เลือก 'เปิดใช้งาน'", desc: "1. เลือก 'เปิดใช้งาน'", data: '-', exp: 'กรองเฉพาะ active + URL มี param' },
  { id: 'J-SHP-LP023', cat: 'Filter-Status', obj: "เลือก 'ปิดใช้งาน'", desc: "1. เลือก 'ปิดใช้งาน'", data: '-', exp: 'กรองเฉพาะ inactive' },
  { id: 'J-SHP-LP024', cat: 'Filter-Status', obj: "เลือก 'ทั้งหมด'", desc: "1. เลือก 'ทั้งหมด'", data: '-', exp: 'แสดงทั้งหมด (clear filter)' },
  { id: 'J-SHP-LP025', cat: 'Filter-Status', obj: 'URL update เมื่อกรอง', desc: '1. ดู URL', data: '-', exp: 'มี ?status=...' },

  { type: 'sub', text: 'D. ตัวกรองประเภทการจัดส่ง' },
  { id: 'J-SHP-LP030', cat: 'Filter-Type', obj: 'เปิด dropdown ประเภท', desc: '1. คลิก combobox ประเภทการจัดส่ง', data: '-', exp: 'dropdown เปิด' },
  { id: 'J-SHP-LP031', cat: 'Filter-Type', obj: 'รายการ options', desc: '1. ดู options', data: '-', exp: 'มีประเภท ≥ 2 (เช่น มาตรฐาน, ด่วน)' },
  { id: 'J-SHP-LP032', cat: 'Filter-Type', obj: 'เลือกประเภท', desc: '1. เลือก option', data: '-', exp: 'กรอง record ตามประเภท' },
  { id: 'J-SHP-LP033', cat: 'Filter-Type', obj: "เลือก 'ทั้งหมด'", desc: "1. เลือก", data: '-', exp: 'แสดงทั้งหมด' },

  { type: 'sub', text: 'E. ปุ่ม ประเภทสินค้าที่รองรับ' },
  { id: 'J-SHP-LP040', cat: 'Filter-Product', obj: "คลิก 'ประเภทสินค้าที่รองรับ'", desc: '1. คลิกปุ่ม', data: '-', exp: 'แสดง popover/dropdown' },
  { id: 'J-SHP-LP041', cat: 'Filter-Product', obj: 'ตัวเลือก', desc: '1. ดูตัวเลือก', data: '-', exp: "'สินค้าทั่วไป', 'สินค้าฝากขาย'" },
  { id: 'J-SHP-LP042', cat: 'Filter-Product', obj: 'Apply filter', desc: '1. เลือก + ตกลง', data: '-', exp: 'กรอง list' },

  { type: 'sub', text: "F. ปุ่ม 'ตัวกรอง' (Combined Filter)" },
  { id: 'J-SHP-LP050', cat: 'Filter-Combined', obj: "ปุ่ม 'ตัวกรอง' มี badge count", desc: '1. ดู', data: '-', exp: "'ตัวกรอง 0'" },
  { id: 'J-SHP-LP051', cat: 'Filter-Combined', obj: 'คลิกเปิด sheet', desc: '1. คลิก', data: '-', exp: 'sheet เปิด' },
  { id: 'J-SHP-LP052', cat: 'Filter-Combined', obj: 'ESC ปิด sheet', desc: '1. กด ESC', data: '-', exp: 'sheet ปิด' },
  { id: 'J-SHP-LP053', cat: 'Filter-Combined', obj: 'Apply filter รวม', desc: '1. ตั้งเงื่อนไข + ตกลง', data: '-', exp: 'กรอง + badge count' },

  { type: 'sub', text: 'G. ปรับแต่งคอลัมน์' },
  { id: 'J-SHP-LP060', cat: 'Customize', obj: 'เปิด menu', desc: "1. คลิก", data: '-', exp: 'menu เปิด' },
  { id: 'J-SHP-LP061', cat: 'Customize', obj: "ซ่อน 'ผู้สร้าง'", desc: '1. uncheck', data: '-', exp: 'คอลัมน์หาย' },
  { id: 'J-SHP-LP062', cat: 'Customize', obj: 'เปิดกลับ', desc: '1. check', data: '-', exp: 'กลับมา' },
  { id: 'J-SHP-LP063', cat: 'Customize', obj: "ซ่อน 'ผู้ให้บริการ'", desc: '1. uncheck', data: '-', exp: 'หาย' },
  { id: 'J-SHP-LP064', cat: 'Customize', obj: 'ESC ปิด', desc: '1. ESC', data: '-', exp: 'ปิด' },
  { id: 'J-SHP-LP065', cat: 'Customize', obj: 'Persistence', desc: '1. ซ่อน + Refresh', data: '-', exp: 'persist (localStorage)' },

  { type: 'sub', text: 'H. จำนวนแถว + Pagination' },
  { id: 'J-SHP-LP070', cat: 'Rows', obj: 'ดู options', desc: '1. คลิก combobox', data: '-', exp: '10, 20, 50, 100' },
  { id: 'J-SHP-LP071', cat: 'Rows', obj: 'เลือก 20', desc: "1. เลือก '20'", data: '-', exp: '≤ 20 row + URL pageSize=20' },
  { id: 'J-SHP-LP072', cat: 'Rows', obj: 'เลือก 50', desc: "1. เลือก '50'", data: '-', exp: '≤ 50 row' },
  { id: 'J-SHP-LP073', cat: 'Rows', obj: 'เลือก 100', desc: "1. เลือก '100'", data: '-', exp: '≤ 100 row' },
  { id: 'J-SHP-LP074', cat: 'Pagination', obj: 'Default ≤ 10', desc: '1. ดูตาราง', data: '-', exp: 'tbody ≤ 10 row' },
  { id: 'J-SHP-LP075', cat: 'Pagination', obj: 'Footer format', desc: '1. ดู footer', data: '-', exp: "'X - Y จาก Z รายการ'" },
  { id: 'J-SHP-LP076', cat: 'Pagination', obj: 'คลิกหน้า 2', desc: '1. คลิก 2', data: '-', exp: 'แสดง record 11-20' },
  { id: 'J-SHP-LP077', cat: 'Pagination', obj: 'Next', desc: '1. คลิกลูกศรขวา', data: '-', exp: 'ไปหน้าถัดไป' },
  { id: 'J-SHP-LP078', cat: 'Pagination', obj: 'Prev', desc: '1. คลิกลูกศรซ้าย', data: '-', exp: 'กลับหน้าก่อน' },
  { id: 'J-SHP-LP079', cat: 'Pagination', obj: 'Prev disabled ที่หน้าแรก', desc: '1. ดูปุ่ม', data: '-', exp: 'disabled' },

  { type: 'sub', text: 'I. ปุ่ม Action ในแถว' },
  { id: 'J-SHP-LP080', cat: 'Action-Row', obj: 'ปุ่ม Edit (ดินสอ)', desc: '1. คลิก', data: '-', exp: 'นำทาง /shipping-methods/update/{id}' },
  { id: 'J-SHP-LP081', cat: 'Action-Row', obj: "ปุ่ม 'Open menu' (3 จุด)", desc: '1. คลิก', data: '-', exp: "['ปิดการใช้งาน'/'เปิดการใช้งาน', 'ลบ']" },
  { id: 'J-SHP-LP082', cat: 'Action-Row', obj: 'Toggle สถานะจาก menu', desc: "1. menu → 'ปิด/เปิด'", data: '-', exp: 'สถานะเปลี่ยน' },
  { id: 'J-SHP-LP083', cat: 'Action-Row', obj: "เมนู 'ลบ'", desc: "1. menu → 'ลบ'", data: '-', exp: 'dialog ยืนยัน' },

  { type: 'sub', text: "J. ปุ่ม 'เพิ่มวิธีการจัดส่ง'" },
  { id: 'J-SHP-LP090', cat: 'Add Button', obj: 'คลิก', desc: '1. คลิกปุ่มมุมขวาบน', data: '-', exp: 'นำทาง /create' },
  { id: 'J-SHP-LP091', cat: 'Add Button', obj: 'ตำแหน่ง', desc: '1. ดู', data: '-', exp: 'มุมขวาบน' },

  { type: 'part', text: 'PART 2: หน้า Create - ข้อมูลทั่วไป' },

  { type: 'sub', text: 'K. เปิดหน้า + Default state' },
  { id: 'J-SHP-CR001', cat: 'Navigation', obj: 'เปิดผ่านปุ่ม', desc: "1. คลิก 'เพิ่มวิธีการจัดส่ง'", data: '-', exp: '/create + ฟอร์มเปล่า' },
  { id: 'J-SHP-CR002', cat: 'Navigation', obj: 'เปิด URL ตรง', desc: '1. พิมพ์ /create', data: '-', exp: 'หน้าโหลด' },
  { id: 'J-SHP-CR003', cat: 'Navigation', obj: 'Breadcrumb', desc: '1. ดู', data: '-', exp: 'มี วิธีการจัดส่ง + สร้าง' },
  { id: 'J-SHP-CR004', cat: 'UI', obj: 'Header', desc: '1. ดูหัวข้อ', data: '-', exp: "'เพิ่มวิธีการจัดส่ง' + 'ระบุรายละเอียดต่างๆ เพื่อเพิ่มวิธีการจัดส่ง'" },
  { id: 'J-SHP-CR005', cat: 'UI', obj: "Section 'ข้อมูลวิธีการจัดส่ง'", desc: '1. ดู section', data: '-', exp: 'visible' },
  { id: 'J-SHP-CR006', cat: 'UI', obj: 'Default status toggle', desc: '1. ดู toggle', data: '-', exp: 'ฉบับร่าง (unchecked)' },
  { id: 'J-SHP-CR007', cat: 'UI', obj: "Default sync 'ใช้เหมือนกัน 2 ภาษา'", desc: '1. ดู toggle', data: '-', exp: 'ON (checked)' },
  { id: 'J-SHP-CR008', cat: 'UI', obj: 'Progress indicator initial', desc: '1. ดู', data: '-', exp: "% ค่าเริ่มต้น (เช่น 33%)" },
  { id: 'J-SHP-CR009', cat: 'UI', obj: 'ปุ่มบันทึก', desc: '1. ดู', data: '-', exp: 'มีปุ่ม' },
  { id: 'J-SHP-CR010', cat: 'UI', obj: 'Default ประเภทการจัดส่ง', desc: '1. ดู combobox', data: '-', exp: "'มาตรฐาน'" },

  { type: 'sub', text: 'L. รูปภาพ (Image Upload + Link)' },
  { id: 'J-SHP-CR020', cat: 'Image', obj: 'Drop zone visible', desc: '1. ดู section รูปภาพ', data: '-', exp: "'ลากและวางไฟล์ภาพที่นี่' + 'คลิกเพื่อเลือกไฟล์'" },
  { id: 'J-SHP-CR021', cat: 'Image', obj: 'รองรับ JPG/PNG', desc: '1. ดูข้อความ', data: '-', exp: 'JPG, PNG (ขนาดสูงสุดต่อ 10 MB/ภาพ)' },
  { id: 'J-SHP-CR022', cat: 'Image', obj: 'Upload JPG ผ่าน input file', desc: '1. เลือกไฟล์ JPG', data: 'image/jpg-1.jpg', exp: 'อัปโหลดสำเร็จ + แสดง preview' },
  { id: 'J-SHP-CR023', cat: 'Image', obj: 'Upload PNG', desc: '1. เลือกไฟล์ PNG', data: 'image/png-1.png', exp: 'อัปโหลดสำเร็จ' },
  { id: 'J-SHP-CR024', cat: 'Image', obj: 'Upload PDF (รูปแบบไม่รองรับ)', desc: '1. เลือก PDF', data: 'image/mid 008312.pdf', exp: 'reject / แสดง error รูปแบบไม่รองรับ' },
  { id: 'J-SHP-CR025', cat: 'Image', obj: 'Upload oversized (>10MB)', desc: '1. เลือกไฟล์ใหญ่', data: 'image/oversized.jpg', exp: 'reject / แสดง error ขนาดเกิน' },
  { id: 'J-SHP-CR026', cat: 'Image', obj: 'Drag and drop', desc: '1. drag JPG drop ลง zone', data: '-', exp: 'อัปโหลดสำเร็จ' },
  { id: 'J-SHP-CR027', cat: 'Image-Link', obj: 'แนบลิงก์รูปภาพ (URL)', desc: '1. กรอก URL', data: 'https://example.com/img.jpg', exp: 'รับ URL ได้' },
  { id: 'J-SHP-CR028', cat: 'Image-Link', obj: 'แนบลิงก์ที่ไม่ใช่ URL', desc: "1. กรอก 'not-a-url'", data: '-', exp: 'อาจ accept หรือ validate' },
  { id: 'J-SHP-CR029', cat: 'Image-Link', obj: 'Empty (Optional)', desc: '1. ไม่กรอก', data: '-', exp: 'บันทึกได้ (optional)' },

  { type: 'sub', text: 'M. รหัสวิธีการจัดส่ง (referenceNo)' },
  { id: 'J-SHP-CR030', cat: 'RefNo', obj: 'กรอกรหัสปกติ', desc: "1. กรอก 'SHIP001'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR031', cat: 'RefNo', obj: 'กรอกตัวอักษร+ตัวเลข', desc: "1. กรอก 'SHIP0123456789'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR032', cat: 'RefNo', obj: 'กรอกอักขระพิเศษ', desc: "1. กรอก 'SHIP-001/!'", data: '-', exp: 'รับค่าได้ / validate ตาม rule' },
  { id: 'J-SHP-CR033', cat: 'RefNo', obj: 'Empty (Optional?)', desc: '1. ไม่กรอก + บันทึก', data: '-', exp: 'บันทึกได้/error ตาม rule' },
  { id: 'J-SHP-CR034', cat: 'RefNo', obj: 'รหัสซ้ำ', desc: '1. กรอกรหัสที่มีอยู่แล้ว', data: '-', exp: 'error/silent fail' },
  { id: 'J-SHP-CR035', cat: 'RefNo', obj: 'ยาวมาก (255+)', desc: '1. กรอก 255 ตัว', data: '-', exp: 'block หรือ accept ตาม limit' },

  { type: 'sub', text: 'N. ประเภทการจัดส่ง (Combobox)' },
  { id: 'J-SHP-CR040', cat: 'ShippingType', obj: 'Default value', desc: '1. ดู combobox', data: '-', exp: "'มาตรฐาน'" },
  { id: 'J-SHP-CR041', cat: 'ShippingType', obj: 'เปิด dropdown', desc: '1. คลิก combobox', data: '-', exp: 'แสดง options' },
  { id: 'J-SHP-CR042', cat: 'ShippingType', obj: 'ตัวเลือก ≥ 2', desc: '1. ดู options', data: '-', exp: 'มาตรฐาน + อื่นๆ' },
  { id: 'J-SHP-CR043', cat: 'ShippingType', obj: 'เปลี่ยนค่า', desc: '1. เลือกค่าอื่น', data: '-', exp: 'combobox อัพเดต' },
  { id: 'J-SHP-CR044', cat: 'ShippingType', obj: 'Required?', desc: '1. ดู indicator', data: '-', exp: 'มี/ไม่มี * (ตาม design)' },

  { type: 'sub', text: 'O. ประเภทสินค้าที่รองรับ (Checkboxes)' },
  { id: 'J-SHP-CR050', cat: 'ProductType', obj: "Checkbox 'สินค้าทั่วไป'", desc: '1. ดู checkbox', data: '-', exp: 'visible' },
  { id: 'J-SHP-CR051', cat: 'ProductType', obj: "Checkbox 'สินค้าฝากขาย'", desc: '1. ดู checkbox', data: '-', exp: 'visible' },
  { id: 'J-SHP-CR052', cat: 'ProductType', obj: 'ติ๊กทั้ง 2 อย่าง', desc: '1. ติ๊กทั้งคู่', data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR053', cat: 'ProductType', obj: 'ไม่ติ๊กเลย + บันทึก', desc: '1. uncheck ทั้งหมด + save', data: '-', exp: 'error ต้องเลือกอย่างน้อย 1 / accept' },

  { type: 'sub', text: 'P. ราคา (Price) — Required' },
  { id: 'J-SHP-CR060', cat: 'Price', obj: 'กรอกราคาปกติ', desc: '1. กรอก 100', data: 'price: 100', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR061', cat: 'Price', obj: 'กรอกราคา 0', desc: '1. กรอก 0', data: 'price: 0', exp: 'รับ 0 ได้ / error' },
  { id: 'J-SHP-CR062', cat: 'Price', obj: 'กรอกทศนิยม', desc: '1. กรอก 99.50', data: '-', exp: 'รับทศนิยม' },
  { id: 'J-SHP-CR063', cat: 'Price', obj: 'กรอกค่าลบ', desc: '1. กรอก -10', data: '-', exp: 'reject ค่าลบ' },
  { id: 'J-SHP-CR064', cat: 'Price', obj: 'กรอกตัวอักษร', desc: "1. พิมพ์ 'abc'", data: '-', exp: 'block (HTML5 number input)' },
  { id: 'J-SHP-CR065', cat: 'Price', obj: 'กรอกค่าใหญ่มาก', desc: '1. กรอก 999999999', data: '-', exp: 'รับ/block ตาม limit' },
  { id: 'J-SHP-CR066', cat: 'Price', obj: 'Empty (Required)', desc: '1. ไม่กรอก + บันทึก', data: '-', exp: "error 'กรุณากรอกราคา'" },
  { id: 'J-SHP-CR067', cat: 'Price', obj: 'Spinbutton arrows', desc: '1. คลิกลูกศรขึ้น/ลง', data: '-', exp: 'ค่าเพิ่ม/ลด ทีละ 1' },

  { type: 'sub', text: 'Q. ผู้ให้บริการขนส่ง (carrier)' },
  { id: 'J-SHP-CR070', cat: 'Carrier', obj: 'กรอกชื่อปกติ', desc: "1. กรอก 'kerry'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR071', cat: 'Carrier', obj: 'กรอกตัวพิมพ์ใหญ่', desc: "1. กรอก 'EMS'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR072', cat: 'Carrier', obj: 'ภาษาไทย', desc: "1. กรอก 'ไปรษณีย์ไทย'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR073', cat: 'Carrier', obj: 'Empty (Optional?)', desc: '1. ไม่กรอก + save', data: '-', exp: 'บันทึกได้/error' },
  { id: 'J-SHP-CR074', cat: 'Carrier', obj: 'ยาวมาก (255+)', desc: '1. กรอก 255 ตัว', data: '-', exp: 'block/accept' },

  { type: 'sub', text: 'R. รูปแบบการจัดส่ง (shippingFormat)' },
  { id: 'J-SHP-CR080', cat: 'Format', obj: 'กรอกรูปแบบ', desc: "1. กรอก 'sameday'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR081', cat: 'Format', obj: "ภาษาไทย", desc: "1. กรอก 'ส่งภายในวันเดียว'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR082', cat: 'Format', obj: 'Empty', desc: '1. ไม่กรอก', data: '-', exp: 'บันทึกได้/error' },

  { type: 'sub', text: 'S. น้ำหนักสูงสุด (maxWeight - kg)' },
  { id: 'J-SHP-CR090', cat: 'MaxWeight', obj: 'กรอกค่าปกติ', desc: '1. กรอก 10', data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR091', cat: 'MaxWeight', obj: 'ทศนิยม', desc: '1. กรอก 0.5', data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR092', cat: 'MaxWeight', obj: 'ค่าลบ', desc: '1. กรอก -1', data: '-', exp: 'reject' },
  { id: 'J-SHP-CR093', cat: 'MaxWeight', obj: 'Empty', desc: '1. ไม่กรอก', data: '-', exp: 'บันทึกได้/error' },

  { type: 'sub', text: 'T. น้ำหนัก x ความยาวสูงสุด (maxWeightLength)' },
  { id: 'J-SHP-CR100', cat: 'MaxWxL', obj: 'กรอกค่าปกติ', desc: '1. กรอก 50', data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR101', cat: 'MaxWxL', obj: 'Empty (Optional)', desc: '1. ไม่กรอก', data: '-', exp: 'บันทึกได้' },

  { type: 'sub', text: 'U. ระยะเวลาจัดส่งโดยประมาณ (วัน)' },
  { id: 'J-SHP-CR110', cat: 'Days', obj: 'กรอกจำนวนวัน', desc: '1. กรอก 3', data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR111', cat: 'Days', obj: 'ทศนิยม', desc: '1. กรอก 1.5', data: '-', exp: 'อาจรับ/ไม่รับ (วันเต็ม)' },
  { id: 'J-SHP-CR112', cat: 'Days', obj: 'ค่าลบ', desc: '1. กรอก -1', data: '-', exp: 'reject' },
  { id: 'J-SHP-CR113', cat: 'Days', obj: 'ค่าใหญ่', desc: '1. กรอก 365', data: '-', exp: 'รับค่าได้' },

  { type: 'part', text: 'PART 3: หน้า Create - ภาษา + Settings + Save' },

  { type: 'sub', text: 'V. ชื่อวิธีการจัดส่ง - ภาษาไทย (Required)' },
  { id: 'J-SHP-CR120', cat: 'NameTH', obj: 'กรอกชื่อ TH ปกติ', desc: "1. กรอก 'ส่งด่วน'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR121', cat: 'NameTH', obj: 'ชื่อสั้น 1 ตัว', desc: "1. กรอก 'ก'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR122', cat: 'NameTH', obj: 'ชื่อยาว 255', desc: '1. กรอก 255 ตัว', data: '-', exp: 'รับค่าได้สูงสุดตาม limit' },
  { id: 'J-SHP-CR123', cat: 'NameTH', obj: 'ชื่อยาวเกิน 256+', desc: '1. กรอก 300', data: '-', exp: 'block/warning' },
  { id: 'J-SHP-CR124', cat: 'NameTH', obj: 'อักขระพิเศษ + emoji', desc: "1. กรอก '🚚 ส่งด่วน'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR125', cat: 'NameTH', obj: 'space-only', desc: "1. กรอก '     '", data: '-', exp: 'validate trim' },
  { id: 'J-SHP-CR126', cat: 'NameTH', obj: 'เว้นว่าง (Required)', desc: '1. ไม่กรอก + บันทึก', data: '-', exp: "error 'กรุณากรอกชื่อ'" },
  { id: 'J-SHP-CR127', cat: 'NameTH', obj: 'XSS', desc: "1. กรอก '<script>'", data: '-', exp: 'รับเป็น text' },

  { type: 'sub', text: 'W. ชื่อวิธีการจัดส่ง - ภาษาอังกฤษ + Sync toggle' },
  { id: 'J-SHP-CR130', cat: 'NameEN', obj: 'Default sync ON → EN disabled', desc: '1. ดู EN field', data: '-', exp: 'EN disabled/locked' },
  { id: 'J-SHP-CR131', cat: 'NameEN', obj: 'ปิด toggle → EN เปิดได้', desc: '1. ปิด toggle', data: '-', exp: 'EN enabled' },
  { id: 'J-SHP-CR132', cat: 'NameEN', obj: 'กรอกชื่อ EN', desc: "1. กรอก 'Express'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR133', cat: 'NameEN', obj: 'EN Required เมื่อ toggle off', desc: '1. ปิด toggle + empty EN + save', data: '-', exp: 'error EN' },
  { id: 'J-SHP-CR134', cat: 'NameEN', obj: 'EN ยาว 300', desc: '1. กรอก 300 ตัว', data: '-', exp: 'block/warning' },

  { type: 'sub', text: 'X. รายละเอียดวิธีการจัดส่ง - ภาษาไทย (Optional)' },
  { id: 'J-SHP-CR140', cat: 'DescTH', obj: 'กรอกรายละเอียด', desc: '1. กรอกข้อความ', data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR141', cat: 'DescTH', obj: 'Empty', desc: '1. ไม่กรอก', data: '-', exp: 'บันทึกได้ (Optional)' },
  { id: 'J-SHP-CR142', cat: 'DescTH', obj: 'Multi-line', desc: '1. กรอก newline', data: '-', exp: 'รับ \\n ได้' },

  { type: 'sub', text: 'Y. รายละเอียดวิธีการจัดส่ง - ภาษาอังกฤษ (Optional)' },
  { id: 'J-SHP-CR150', cat: 'DescEN', obj: 'กรอกรายละเอียด EN', desc: '1. กรอก', data: '-', exp: 'รับค่าได้' },
  { id: 'J-SHP-CR151', cat: 'DescEN', obj: 'Empty', desc: '1. ไม่กรอก', data: '-', exp: 'บันทึกได้' },

  { type: 'sub', text: 'Z. Toggle สถานะ (ฉบับร่าง / เปิดใช้งาน)' },
  { id: 'J-SHP-CR160', cat: 'StatusToggle', obj: 'Default = ฉบับร่าง', desc: '1. ดู toggle', data: '-', exp: 'unchecked' },
  { id: 'J-SHP-CR161', cat: 'StatusToggle', obj: 'Toggle ON', desc: '1. คลิก', data: '-', exp: 'state = checked' },
  { id: 'J-SHP-CR162', cat: 'StatusToggle', obj: 'บันทึกใน ฉบับร่าง', desc: '1. ไม่แตะ + save', data: '-', exp: 'record ฉบับร่าง' },
  { id: 'J-SHP-CR163', cat: 'StatusToggle', obj: 'บันทึกใน เปิดใช้งาน', desc: '1. เปิด + save', data: '-', exp: 'record เปิดใช้งาน' },

  { type: 'sub', text: 'AA. Progress Indicator' },
  { id: 'J-SHP-CR170', cat: 'Progress', obj: 'Initial value', desc: '1. ดูค่าเริ่มต้น', data: '-', exp: '~33% (ตาม default ที่กรอกไว้)' },
  { id: 'J-SHP-CR171', cat: 'Progress', obj: 'Update เมื่อกรอก', desc: '1. กรอกชื่อ + ราคา', data: '-', exp: '% เพิ่ม' },
  { id: 'J-SHP-CR172', cat: 'Progress', obj: '100% เมื่อกรอกครบ', desc: '1. กรอกทุก required', data: '-', exp: '100% / ข้อมูลครบถ้วน' },

  { type: 'sub', text: 'BB. ปุ่มบันทึก (Save)' },
  { id: 'J-SHP-CR180', cat: 'Save', obj: 'Happy path บันทึก', desc: '1. กรอกครบ required (ชื่อ TH/EN + ราคา) + save', data: '-', exp: 'Toast สำเร็จ + redirect ไป list' },
  { id: 'J-SHP-CR181', cat: 'Save', obj: 'บันทึกฟอร์มเปล่า', desc: '1. คลิก save ทันที', data: '-', exp: 'error ทุก required' },
  { id: 'J-SHP-CR182', cat: 'Save', obj: 'ขาดชื่อ TH', desc: '1. ขาด TH + อื่นครบ', data: '-', exp: 'error TH' },
  { id: 'J-SHP-CR183', cat: 'Save', obj: 'ขาด EN (toggle off)', desc: '1. ปิด toggle + empty EN + save', data: '-', exp: 'error EN' },
  { id: 'J-SHP-CR184', cat: 'Save', obj: 'ขาดราคา', desc: '1. empty price + save', data: '-', exp: 'error ราคา' },
  { id: 'J-SHP-CR185', cat: 'Save', obj: 'Double click', desc: '1. คลิก 2 ครั้งติด', data: '-', exp: 'ปุ่ม disable / ไม่ duplicate' },
  { id: 'J-SHP-CR186', cat: 'Save', obj: 'Loading state', desc: '1. ดูปุ่มขณะ save', data: '-', exp: 'spinner/disabled' },
  { id: 'J-SHP-CR187', cat: 'Save', obj: 'Duplicate name', desc: '1. ใช้ชื่อซ้ำ', data: '-', exp: 'error/silent fail' },
  { id: 'J-SHP-CR188', cat: 'Save', obj: 'Network ขาด', desc: '1. ตัด net + save', data: '-', exp: 'error' },
  { id: 'J-SHP-CR189', cat: 'Save', obj: 'Server 500', desc: '1. mock 500', data: '-', exp: 'error' },

  { type: 'sub', text: 'CC. การยกเลิก / ออกจากหน้า' },
  { id: 'J-SHP-CR190', cat: 'Exit', obj: 'ออก clean', desc: '1. breadcrumb back', data: '-', exp: 'กลับ list (no warning)' },
  { id: 'J-SHP-CR191', cat: 'Exit', obj: 'beforeunload dirty', desc: '1. กรอก + navigate ออก', data: '-', exp: 'browser warning' },
  { id: 'J-SHP-CR192', cat: 'Exit', obj: 'Browser back dirty', desc: '1. back', data: '-', exp: 'warning' },
  { id: 'J-SHP-CR193', cat: 'Exit', obj: 'Refresh dirty', desc: '1. F5', data: '-', exp: 'warning' },
  { id: 'J-SHP-CR194', cat: 'Exit', obj: 'Back arrow UI', desc: '1. คลิก back arrow', data: '-', exp: 'กลับ list (มี warning ถ้า dirty)' },

  { type: 'part', text: 'PART 4: หน้า Edit (แก้ไขวิธีการจัดส่ง)' },

  { type: 'sub', text: 'DD. เปิดหน้า Edit' },
  { id: 'J-SHP-ED001', cat: 'Edit-Open', obj: 'เปิดผ่านไอคอน Edit', desc: '1. คลิกดินสอ', data: '-', exp: '/update/{id} โหลด' },
  { id: 'J-SHP-ED002', cat: 'Edit-Open', obj: 'เปิด URL ตรง', desc: '1. พิมพ์ URL', data: '-', exp: 'หน้าโหลด' },
  { id: 'J-SHP-ED003', cat: 'Edit-Open', obj: "Header 'แก้ไข'", desc: '1. ดู', data: '-', exp: "'แก้ไข' + 'ระบุรายละเอียดต่างๆ เพื่อแก้ไขวิธีการจัดส่ง'" },
  { id: 'J-SHP-ED004', cat: 'Edit-Open', obj: 'Progress ครบถ้วน', desc: '1. ดู indicator', data: '-', exp: "'ข้อมูลครบถ้วน 100%'" },
  { id: 'J-SHP-ED005', cat: 'Edit-Open', obj: 'โหลดข้อมูลเดิม', desc: '1. ดูฟิลด์', data: '-', exp: 'ตรงกับ record' },
  { id: 'J-SHP-ED006', cat: 'Edit-Open', obj: 'Invalid ID', desc: '1. /update/99999999', data: '-', exp: '404 / redirect' },

  { type: 'sub', text: 'EE. แก้ไขฟิลด์ + บันทึก' },
  { id: 'J-SHP-ED010', cat: 'Edit-Update', obj: 'แก้ชื่อ TH + save', data: '-', desc: '1. แก้ชื่อ | 2. save', exp: 'Toast สำเร็จ + อัพเดต' },
  { id: 'J-SHP-ED011', cat: 'Edit-Update', obj: 'แก้ราคา + save', desc: '1. แก้ราคา | 2. save', data: '-', exp: 'อัพเดต' },
  { id: 'J-SHP-ED012', cat: 'Edit-Update', obj: 'เปลี่ยนสถานะ + save', desc: '1. toggle | 2. save', data: '-', exp: 'อัพเดต' },
  { id: 'J-SHP-ED013', cat: 'Edit-Update', obj: 'เปลี่ยนประเภทการจัดส่ง', desc: '1. เลือก combobox | 2. save', data: '-', exp: 'อัพเดต' },
  { id: 'J-SHP-ED014', cat: 'Edit-Update', obj: 'เคลียร์ชื่อ + save', desc: '1. clear TH + save', data: '-', exp: "error 'กรุณากรอกชื่อ'" },
  { id: 'J-SHP-ED015', cat: 'Edit-Update', obj: 'แก้แล้วยกเลิก', desc: '1. แก้ + visit list', data: '-', exp: 'ค่าเดิมไม่เปลี่ยน' },

  { type: 'sub', text: 'FF. เมนู 3-จุด (List + Edit)' },
  { id: 'J-SHP-ED020', cat: 'Menu', obj: 'Open menu บน list row', desc: '1. คลิก 3 จุด', data: '-', exp: "['ปิด/เปิดการใช้งาน', 'ลบ']" },
  { id: 'J-SHP-ED021', cat: 'Menu', obj: 'Toggle สถานะ via menu', desc: "1. menu → toggle", data: '-', exp: 'สถานะเปลี่ยน + อาจมี confirm' },
  { id: 'J-SHP-ED022', cat: 'Menu', obj: "เมนู 'ลบ' → cancel", desc: "1. menu → 'ลบ' → ยกเลิก", data: '-', exp: 'dialog ปิด record ยังอยู่' },
  { id: 'J-SHP-ED023', cat: 'Menu', obj: 'Confirm dialog text', desc: "1. menu → 'ลบ'", data: '-', exp: 'มีข้อความยืนยัน' },
  { id: 'J-SHP-ED024', cat: 'Menu', obj: 'ยืนยันลบ', desc: '1. ยืนยันลบ', data: '-', exp: "Toast 'สำเร็จ' + หาย" },

  { type: 'part', text: 'PART 5: UI/UX + Permission/Security' },

  { type: 'sub', text: 'GG. UI/UX' },
  { id: 'J-SHP-UX001', cat: 'Responsive', obj: 'Desktop 1920', desc: '1. เปิด 1920px', data: '-', exp: 'Layout ปกติ' },
  { id: 'J-SHP-UX002', cat: 'Responsive', obj: 'Tablet 768', desc: '1. ปรับ 768px', data: '-', exp: 'Responsive' },
  { id: 'J-SHP-UX003', cat: 'Responsive', obj: 'Mobile 375', desc: '1. ปรับ 375px', data: '-', exp: 'Responsive' },
  { id: 'J-SHP-UX004', cat: 'Browser-Chrome', obj: 'Chrome', desc: '1. เปิด Chrome', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-SHP-UX005', cat: 'Browser-Firefox', obj: 'Firefox', desc: '1. Firefox', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-SHP-UX006', cat: 'Browser-Safari', obj: 'Safari', desc: '1. Safari', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-SHP-UX007', cat: 'Browser-Edge', obj: 'Edge', desc: '1. Edge', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-SHP-UX008', cat: 'Accessibility', obj: 'Tab navigation', desc: '1. Tab', data: '-', exp: 'Focus ตามลำดับ' },
  { id: 'J-SHP-UX009', cat: 'Accessibility', obj: 'Enter ใน input', desc: '1. Enter', data: '-', exp: 'ไม่ submit อัตโนมัติ' },
  { id: 'J-SHP-UX010', cat: 'Loading', obj: 'Loading state', desc: '1. โหลดหน้า', data: '-', exp: 'skeleton' },

  { type: 'sub', text: 'HH. Permission / Security' },
  { id: 'J-SHP-SEC001', cat: 'Permission-NoLogin', obj: 'ไม่ login', desc: '1. logout + URL', data: '-', exp: 'redirect login' },
  { id: 'J-SHP-SEC002', cat: 'Permission-NoPerm', obj: 'No permission user', desc: '1. login no-perm', data: '-', exp: '403/ซ่อนปุ่ม' },
  { id: 'J-SHP-SEC003', cat: 'Session-Timeout', obj: 'Session timeout', desc: '1. กรอก + รอ timeout + save', data: '-', exp: 'redirect login' },
  { id: 'J-SHP-SEC004', cat: 'XSS-Display', obj: 'XSS display', desc: '1. สร้างชื่อ <script>', data: '-', exp: 'แสดงเป็น text' },
  { id: 'J-SHP-SEC005', cat: 'CSRF', obj: 'CSRF token', desc: '1. ตรวจ request', data: '-', exp: 'มี token' },
]

function field(s) {
  if (s == null) return ''
  s = String(s)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}
const blank = ',,,,,,,'
const sectionRow = (text) => `${field(text)},,,,,,,`

const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
const lines = [
  `Project Name :,JIB-Ecommerce,,,Create Date :,2026-06-01,,`,
  `Project ID :,,,,Start Test Date :,2026-06-01,,`,
  `Tester Name :,admin zero,,,Finish Test Date :,2026-06-01,,`,
  `Project Release / Version :,1.0,,,Module / Function :,${field('วิธีการจัดส่ง (Shipping Methods) - List + Create + Edit + Delete')},,`,
  `URL List :,https://devstorex.jibc.codelabdev.co/store/product-manager/shipping-methods,,,,,,`,
  `URL Create :,https://devstorex.jibc.codelabdev.co/store/product-manager/shipping-methods/create,,,,,,`,
  `URL Edit :,${field('https://devstorex.jibc.codelabdev.co/store/product-manager/shipping-methods/update/{id}')},,,,,,`,
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
lines.push(`Notes :,${field('1. ทดสอบบน Chrome (Chromium) ผ่าน Puppeteer (Cypress binary เครื่องนี้ไม่พร้อม)')},,,,,,`)
lines.push(`,${field('2. ทดสอบบน devstorex.jibc.codelabdev.co')},,,,,,`)
lines.push(`,${field('3. ฟอร์ม Create มีฟิลด์เยอะมาก: รูปภาพ upload + link, รหัส (referenceNo), ประเภทการจัดส่ง (combobox), ประเภทสินค้าที่รองรับ (2 checkboxes: ทั่วไป/ฝากขาย), ราคา* (required), ผู้ให้บริการ, รูปแบบ, น้ำหนักสูงสุด, น้ำหนัก×ความยาว, ระยะเวลา (วัน), ชื่อ+รายละเอียด TH/EN, sync toggle, สถานะ')},,,,,,`)
lines.push(`,${field('4. Status filter ใน devstorex มี 3 ตัวเลือก: ทั้งหมด / เปิดใช้งาน / ปิดใช้งาน (ไม่มี bug แบบ tags ที่ขาด "ปิดใช้งาน")')},,,,,,`)
lines.push(`,${field('5. Sections "-- ... --" ใช้ตัวคั่นมาตรฐาน (ไม่ใช้ #/=) ตามรูปแบบ test case JIB')},,,,,,`)
lines.push(`,${field('6. [Bug] ED006: URL /update/{invalid-id} → render Edit-like form ไม่ redirect/404 (pattern เดียวกับ tags, template-options, mapping-conditions, filters)')},,,,,,`)
lines.push(`,${field('7. [Warning] CR123/CR134: ฟิลด์ชื่อ TH/EN รับเกิน 256 ตัวอักษร (ไม่มี maxLength client-side)')},,,,,,`)
lines.push(`,${field('8. [Warning] CR125: รับ space-only ใน TH (ไม่ trim client-side)')},,,,,,`)
lines.push(`,${field('9. [Warning] CR028: input ลิงก์รูปภาพรับ "not-a-url" ได้ (ต้อง validate ตอน save)')},,,,,,`)
lines.push(`,${field('10. Image upload (CR022-CR026): Not Tested - ต้องใช้ไฟล์จริงจากโฟลเดอร์ /image/ ใน automated ทำได้ผ่าน input[type=file].uploadFile() แต่ skip รอบนี้')},,,,,,`)
lines.push(`,${field('11. Happy path Save (CR180) สำเร็จ + Edit chain (ED010-ED012) ครบ - seeded record ถูกลบในขั้นท้าย (ED024) แต่ result Warning เพราะ search debounce timing - record อาจถูกลบสำเร็จจริง')},,,,,,`)
lines.push(`,${field('12. Not Tested ส่วนใหญ่: Cross-browser, Responsive (tablet/mobile), Image upload, Network/Server mocking, Permission/Session timeout, Double-click race')},,,,,,`)

fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log('Total defined cases:', ROWS.filter((r) => r.id).length)
console.log('Summary:', sum, '| pass rate:', passRate + '%', '| fail rate:', failRate + '%')
console.log('Written:', OUT)
