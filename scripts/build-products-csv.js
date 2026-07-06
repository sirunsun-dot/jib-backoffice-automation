/** Build JIB_TestCases_Products_Full.csv — comprehensive */
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '../JIB_TestCases_Products_Full.csv')
let results = {}
try { results = JSON.parse(fs.readFileSync(path.join(__dirname, 'products-test-results.json'), 'utf8')) } catch {}

const OVERRIDES = {}
for (const [k, v] of Object.entries(OVERRIDES)) results[k] = { ...(results[k] || {}), ...v }

const ROWS = [
  { type: 'part', text: 'PART 1: หน้า List (รายการสินค้า)' },
  { type: 'sub', text: 'A. การโหลดหน้า + UI Elements' },
  { id: 'J-PROD-LP001', cat: 'Page Load', obj: 'เปิดหน้ารายการ', desc: '1. /products', data: '-', exp: 'ตาราง + controls ครบ' },
  { id: 'J-PROD-LP002', cat: 'UI', obj: 'Breadcrumb', desc: '1. ดู', data: '-', exp: 'ร้านค้า > จัดการสินค้า > สินค้า' },
  { id: 'J-PROD-LP003', cat: 'UI', obj: 'Header + คำอธิบาย', desc: '1. ดู', data: '-', exp: "'สินค้า' + 'จัดการสินค้าในระบบ'" },
  { id: 'J-PROD-LP004', cat: 'UI', obj: 'คอลัมน์ตาราง (~34 cols)', desc: '1. ดู thead', data: '-', exp: 'มี SKU, สินค้า, สถานะสินค้า, สถานะการขาย, การเชื่อมต่อ ITECH, ประเภทสินค้า, ตัวเลือกสินค้า, แบรนด์, สต๊อก, ราคา, Supplier, หมวดหมู่, จัดการ ฯลฯ' },
  { id: 'J-PROD-LP005', cat: 'UI', obj: 'Action Bar', desc: '1. ดู', data: '-', exp: 'ค้นหา, ตัวกรอง, ปรับแต่งคอลัมน์, เพิ่มสินค้า' },
  { id: 'J-PROD-LP006', cat: 'UI', obj: 'Empty state', desc: '1. ค้นหาที่ไม่มี', data: '-', exp: "'ไม่พบข้อมูล' / '0 - 0 จาก 0'" },
  { id: 'J-PROD-LP007', cat: 'UI', obj: 'Loading state', desc: '1. โหลดหน้า', data: '-', exp: 'skeleton' },

  { type: 'sub', text: 'B. Tabs ประเภทสินค้า (10 tabs)' },
  { id: 'J-PROD-LP010', cat: 'Tab', obj: "Tab 'ทั้งหมด' มี count", desc: '1. ดู', data: '-', exp: "'ทั้งหมด N'" },
  { id: 'J-PROD-LP011', cat: 'Tab', obj: "Tab 'สินค้าปกติ'", desc: '1. คลิก', data: '-', exp: 'กรอง' },
  { id: 'J-PROD-LP012', cat: 'Tab', obj: "Tab 'สินค้าตัวเลือก'", desc: '1. คลิก', data: '-', exp: 'กรอง' },
  { id: 'J-PROD-LP013', cat: 'Tab', obj: "Tab 'สินค้าชิ้นส่วนประกอบคอมพิวเตอร์'", desc: '1. คลิก', data: '-', exp: 'กรอง' },
  { id: 'J-PROD-LP014', cat: 'Tab', obj: "Tab 'คอมพิวเตอร์เซ็ต'", desc: '1. คลิก', data: '-', exp: 'กรอง' },
  { id: 'J-PROD-LP015', cat: 'Tab', obj: "Tab 'สินค้าซอฟต์แวร์/ดิจิทัล'", desc: '1. คลิก', data: '-', exp: 'กรอง' },
  { id: 'J-PROD-LP016', cat: 'Tab', obj: "Tab 'สินค้าพรีออเดอร์'", desc: '1. คลิก', data: '-', exp: 'กรอง' },
  { id: 'J-PROD-LP017', cat: 'Tab', obj: "Tab 'สินค้าฝากขาย'", desc: '1. คลิก', data: '-', exp: 'กรอง' },
  { id: 'J-PROD-LP018', cat: 'Tab', obj: "Tab 'สินค้าใหม่'", desc: '1. คลิก', data: '-', exp: 'กรอง' },
  { id: 'J-PROD-LP019', cat: 'Tab', obj: "Tab 'ถังขยะ'", desc: '1. คลิก', data: '-', exp: 'แสดง trash records' },

  { type: 'sub', text: 'C. การค้นหา' },
  { id: 'J-PROD-LP020', cat: 'Search', obj: 'ค้นหา TH', desc: '1. พิมพ์', data: '-', exp: 'กรอง + ?search=' },
  { id: 'J-PROD-LP021', cat: 'Search', obj: 'ค้นหา SKU', desc: '1. พิมพ์ SKU', data: '-', exp: 'กรองตาม SKU' },
  { id: 'J-PROD-LP022', cat: 'Search', obj: 'ค้นหา EN', desc: '1. พิมพ์ EN', data: '-', exp: 'กรอง' },
  { id: 'J-PROD-LP023', cat: 'Search', obj: 'ค้นหาที่ไม่มี', desc: '1. พิมพ์', data: '-', exp: 'empty state' },
  { id: 'J-PROD-LP024', cat: 'Search', obj: 'อักขระพิเศษ', desc: "1. '@#$%'", data: '-', exp: 'ไม่ error' },
  { id: 'J-PROD-LP025', cat: 'Search', obj: 'space-only', desc: '1. spaces', data: '-', exp: 'ไม่ filter' },
  { id: 'J-PROD-LP026', cat: 'Search', obj: 'XSS', desc: '1. <script>', data: '-', exp: 'รับเป็น text' },
  { id: 'J-PROD-LP027', cat: 'Search', obj: 'เคลียร์', desc: '1. ลบ', data: '-', exp: 'list กลับมา' },

  { type: 'sub', text: 'D. ตัวกรอง + ปรับแต่งคอลัมน์' },
  { id: 'J-PROD-LP030', cat: 'Filter', obj: 'ปุ่ม ตัวกรอง', desc: '1. คลิก', data: '-', exp: 'sheet เปิด' },
  { id: 'J-PROD-LP031', cat: 'Filter', obj: 'ESC ปิด', desc: '1. ESC', data: '-', exp: 'ปิด' },
  { id: 'J-PROD-LP032', cat: 'Customize', obj: 'เปิด menu', desc: '1. คลิก', data: '-', exp: 'menu เปิด' },
  { id: 'J-PROD-LP033', cat: 'Customize', obj: 'ซ่อน SKU', desc: '1. uncheck', data: '-', exp: 'หาย' },
  { id: 'J-PROD-LP034', cat: 'Customize', obj: 'ซ่อน ราคา', desc: '1. uncheck', data: '-', exp: 'หาย' },
  { id: 'J-PROD-LP035', cat: 'Customize', obj: 'ซ่อน Supplier', desc: '1. uncheck', data: '-', exp: 'หาย' },
  { id: 'J-PROD-LP036', cat: 'Customize', obj: 'เปิดกลับ', desc: '1. check', data: '-', exp: 'กลับมา' },

  { type: 'sub', text: 'E. จำนวนแถว + Pagination' },
  { id: 'J-PROD-LP040', cat: 'Rows', obj: 'ดู options', desc: '1. คลิก combobox', data: '-', exp: '10/20/50/100' },
  { id: 'J-PROD-LP041', cat: 'Rows', obj: 'เลือก 20', desc: '1. เลือก', data: '-', exp: '≤ 20 row' },
  { id: 'J-PROD-LP042', cat: 'Rows', obj: 'เลือก 50', desc: '1. เลือก', data: '-', exp: '≤ 50' },
  { id: 'J-PROD-LP043', cat: 'Rows', obj: 'เลือก 100', desc: '1. เลือก', data: '-', exp: '≤ 100' },
  { id: 'J-PROD-LP044', cat: 'Pagination', obj: 'Default ≤ 10', desc: '1. ดู', data: '-', exp: '≤ 10' },
  { id: 'J-PROD-LP045', cat: 'Pagination', obj: 'Footer format', desc: '1. ดู', data: '-', exp: "'X - Y จาก Z'" },
  { id: 'J-PROD-LP046', cat: 'Pagination', obj: 'คลิกหน้า 2', desc: '1. คลิก 2', data: '-', exp: 'แสดง record 11-20' },
  { id: 'J-PROD-LP047', cat: 'Pagination', obj: 'Next/Prev', desc: '1. คลิกลูกศร', data: '-', exp: 'เปลี่ยนหน้า' },

  { type: 'sub', text: 'F. Row Actions' },
  { id: 'J-PROD-LP050', cat: 'Row', obj: 'ปุ่ม Edit (ดินสอ)', desc: '1. คลิก', data: '-', exp: '/products/update/{id}' },
  { id: 'J-PROD-LP051', cat: 'Row', obj: '3-dot menu', desc: '1. คลิก', data: '-', exp: 'menu: ปิด/เปิดการใช้งาน, ลบ' },
  { id: 'J-PROD-LP052', cat: 'Row', obj: "Toggle 'ปิด/เปิดการใช้งาน'", desc: '1. menu → toggle', data: '-', exp: 'สถานะเปลี่ยน' },
  { id: 'J-PROD-LP053', cat: 'Row', obj: "เมนู 'ลบ'", desc: '1. menu → ลบ', data: '-', exp: 'dialog ยืนยัน' },
  { id: 'J-PROD-LP054', cat: 'Row', obj: 'อัพเดท Spec column', desc: '1. ดู column', data: '-', exp: 'มี action button' },

  { type: 'sub', text: "G. ปุ่ม 'เพิ่มสินค้า'" },
  { id: 'J-PROD-LP060', cat: 'Add', obj: 'คลิก', desc: '1. คลิก', data: '-', exp: '/products/create' },

  { type: 'part', text: 'PART 2: หน้า Create - Section ข้อมูลทั่วไป' },
  { type: 'sub', text: 'H. Default state + Header' },
  { id: 'J-PROD-CR001', cat: 'UI', obj: 'Header', desc: '1. ดู', data: '-', exp: "'เพิ่มสินค้าใหม่' + คำอธิบาย" },
  { id: 'J-PROD-CR002', cat: 'UI', obj: 'Preview section', desc: '1. ดู', data: '-', exp: 'แสดง preview: ชื่อ + ไฮไลท์ + ราคา' },
  { id: 'J-PROD-CR003', cat: 'UI', obj: '8 Sections (Tabs)', desc: '1. ดู section navigation', data: '-', exp: 'ข้อมูลทั่วไป, รูปภาพ/วีดีโอ/360, ไฮไลท์/ฟีเจอร์, คุณสมบัติ, คลังสินค้าและราคา, แท็กสินค้า, ตัวกรองสินค้า, SEO' },
  { id: 'J-PROD-CR004', cat: 'UI', obj: 'Language tabs', desc: '1. ดู', data: '-', exp: 'ไทย / Eng tabs' },
  { id: 'J-PROD-CR005', cat: 'UI', obj: 'Default status = กำลังเปิดใช้งาน', desc: '1. ดู', data: '-', exp: 'checked' },
  { id: 'J-PROD-CR006', cat: 'UI', obj: '2x sync toggles default ON', desc: '1. ดู', data: '-', exp: 'name + highlight sync = checked' },
  { id: 'J-PROD-CR007', cat: 'UI', obj: '3x product type toggles default OFF', desc: '1. ดู', data: '-', exp: 'สินค้าชิ้นส่วน, สินค้าตัวเลือก, อุปกรณ์เสริม = unchecked' },
  { id: 'J-PROD-CR008', cat: 'UI', obj: 'Progress = 0%', desc: '1. ดู', data: '-', exp: "'ยังไม่มีข้อมูล 0%'" },
  { id: 'J-PROD-CR009', cat: 'UI', obj: 'ปุ่ม ดูตัวอย่าง + บันทึก', desc: '1. ดู', data: '-', exp: 'มี' },

  { type: 'sub', text: 'I. SKU (รหัสสินค้า - Required)' },
  { id: 'J-PROD-CR010', cat: 'SKU', obj: 'กรอก SKU ปกติ', desc: "1. 'JIB001'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-PROD-CR011', cat: 'SKU', obj: 'SKU ตัวอักษร+ตัวเลข', desc: '1. JIB0123456789', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR012', cat: 'SKU', obj: 'SKU อักขระพิเศษ', desc: "1. 'JIB-001/!'", data: '-', exp: 'รับค่า/validate' },
  { id: 'J-PROD-CR013', cat: 'SKU', obj: 'SKU ยาวมาก (255+)', desc: '1. 255 ตัว', data: '-', exp: 'block/accept' },
  { id: 'J-PROD-CR014', cat: 'SKU', obj: 'SKU empty + save', desc: '1. empty + save', data: '-', exp: "error 'กรุณากรอก SKU'" },
  { id: 'J-PROD-CR015', cat: 'SKU', obj: 'SKU ซ้ำ', desc: '1. ใช้ SKU ที่มี + save', data: '-', exp: 'error/silent fail' },
  { id: 'J-PROD-CR016', cat: 'SKU', obj: 'XSS ใน SKU', desc: '1. <script>', data: '-', exp: 'รับเป็น text' },

  { type: 'sub', text: 'J. ชื่อสินค้า TH/EN + Sync (Required)' },
  { id: 'J-PROD-CR020', cat: 'NameTH', obj: 'ชื่อ TH ปกติ', desc: '1. กรอก', data: '-', exp: 'รับค่า' },
  { id: 'J-PROD-CR021', cat: 'NameTH', obj: 'ชื่อ 1 ตัว', desc: '1. "ก"', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR022', cat: 'NameTH', obj: 'ชื่อยาว 255', desc: '1. 255', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR023', cat: 'NameTH', obj: 'ชื่อยาว 300', desc: '1. 300', data: '-', exp: 'block/warning' },
  { id: 'J-PROD-CR024', cat: 'NameTH', obj: 'อักขระพิเศษ + emoji', desc: "1. '🎮 สินค้า'", data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR025', cat: 'NameTH', obj: 'space-only', desc: '1. spaces', data: '-', exp: 'validate trim' },
  { id: 'J-PROD-CR026', cat: 'NameTH', obj: 'Empty + save', desc: '1. empty + save', data: '-', exp: 'error required' },
  { id: 'J-PROD-CR027', cat: 'NameTH', obj: 'XSS', desc: '1. <script>', data: '-', exp: 'เป็น text' },
  { id: 'J-PROD-CR028', cat: 'NameEN', obj: 'EN locked (sync ON)', desc: '1. ดู', data: '-', exp: 'disabled' },
  { id: 'J-PROD-CR029', cat: 'NameEN', obj: 'ปิด sync → EN unlock', desc: '1. ปิด toggle', data: '-', exp: 'editable' },
  { id: 'J-PROD-CR030', cat: 'NameEN', obj: 'EN ยาว 300', desc: '1. 300', data: '-', exp: 'รับ/warning' },
  { id: 'J-PROD-CR031', cat: 'NameEN', obj: 'EN empty (toggle off) + save', desc: '1. empty + save', data: '-', exp: 'error' },

  { type: 'sub', text: 'K. การ์ดสินค้า/Highlight TH/EN' },
  { id: 'J-PROD-CR040', cat: 'Highlight', obj: 'การ์ด TH', desc: '1. กรอก', data: '-', exp: 'รับค่า' },
  { id: 'J-PROD-CR041', cat: 'Highlight', obj: 'การ์ด TH ยาวมาก', desc: '1. 500 ตัว', data: '-', exp: 'รับ/block' },
  { id: 'J-PROD-CR042', cat: 'Highlight', obj: 'การ์ด multi-line', desc: '1. newline', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR043', cat: 'Highlight', obj: 'การ์ด empty (optional)', desc: '1. ไม่กรอก', data: '-', exp: 'บันทึกได้' },
  { id: 'J-PROD-CR044', cat: 'Highlight', obj: 'EN sync toggle (อันที่ 2)', desc: '1. ดู', data: '-', exp: 'มี toggle แยกสำหรับ highlight' },
  { id: 'J-PROD-CR045', cat: 'Highlight', obj: 'การ์ด EN', desc: '1. กรอก (ปิด sync)', data: '-', exp: 'รับค่า' },

  { type: 'sub', text: 'L. แบรนด์ + การรับประกัน + หมวดหมู่ (Comboboxes)' },
  { id: 'J-PROD-CR050', cat: 'Brand', obj: 'เปิด dropdown แบรนด์', desc: '1. คลิก combobox', data: '-', exp: 'options ≥ 1' },
  { id: 'J-PROD-CR051', cat: 'Brand', obj: 'เลือกแบรนด์', desc: '1. เลือก', data: '-', exp: 'combobox update' },
  { id: 'J-PROD-CR052', cat: 'Brand', obj: 'Required (label มี *)', desc: '1. ดู label', data: '-', exp: 'แบรนด์*' },
  { id: 'J-PROD-CR053', cat: 'Warranty', obj: 'เปิด dropdown', desc: '1. คลิก', data: '-', exp: 'options' },
  { id: 'J-PROD-CR054', cat: 'Warranty', obj: 'เลือก / optional', desc: '1. เลือก/ไม่เลือก', data: '-', exp: 'optional' },
  { id: 'J-PROD-CR055', cat: 'Category', obj: 'เลือกหมวดหมู่หลัก*', desc: '1. คลิก + เลือก', data: '-', exp: 'required' },
  { id: 'J-PROD-CR056', cat: 'Category', obj: 'เลือกหมวดหมู่รอง* (after main)', desc: '1. คลิก + เลือก', data: '-', exp: 'required + เปิดได้หลังเลือก main' },
  { id: 'J-PROD-CR057', cat: 'Category', obj: 'เลือกหมวดหมู่สินค้า*', desc: '1. คลิก + เลือก', data: '-', exp: 'required' },

  { type: 'sub', text: 'M. ขนาด/น้ำหนัก (สินค้า + รวม)' },
  { id: 'J-PROD-CR060', cat: 'Dimension', obj: 'น้ำหนักสินค้า (kg)', desc: '1. กรอก 1.5', data: '-', exp: 'รับค่า' },
  { id: 'J-PROD-CR061', cat: 'Dimension', obj: 'ความกว้าง (cm)', desc: '1. กรอก 30', data: '-', exp: 'รับค่า' },
  { id: 'J-PROD-CR062', cat: 'Dimension', obj: 'ความยาว (cm)', desc: '1. กรอก 50', data: '-', exp: 'รับค่า' },
  { id: 'J-PROD-CR063', cat: 'Dimension', obj: 'ความสูง (cm)', desc: '1. กรอก 20', data: '-', exp: 'รับค่า' },
  { id: 'J-PROD-CR064', cat: 'Dimension', obj: 'น้ำหนักรวม (kg)', desc: '1. กรอก', data: '-', exp: 'รับค่า (รวมพัสดุ)' },
  { id: 'J-PROD-CR065', cat: 'Dimension', obj: 'ขนาดรวม (กว้าง/ยาว/สูง)', desc: '1. กรอก', data: '-', exp: 'รับค่า' },
  { id: 'J-PROD-CR066', cat: 'Dimension', obj: 'ค่าลบ', desc: '1. -1', data: '-', exp: 'reject/block' },
  { id: 'J-PROD-CR067', cat: 'Dimension', obj: 'ค่าทศนิยม', desc: '1. 0.5', data: '-', exp: 'รับค่า' },

  { type: 'sub', text: 'N. Product Type Toggles (3 ประเภท)' },
  { id: 'J-PROD-CR070', cat: 'Type-Toggle', obj: 'Toggle ชิ้นส่วนประกอบคอม', desc: '1. คลิก toggle', data: '-', exp: 'state เปลี่ยน' },
  { id: 'J-PROD-CR071', cat: 'Type-Toggle', obj: 'Toggle สินค้าตัวเลือก (variants)', desc: '1. คลิก', data: '-', exp: 'state เปลี่ยน + อาจแสดง variant section' },
  { id: 'J-PROD-CR072', cat: 'Type-Toggle', obj: 'Toggle อุปกรณ์เสริม', desc: '1. คลิก', data: '-', exp: 'state เปลี่ยน' },
  { id: 'J-PROD-CR073', cat: 'Type-Toggle', obj: 'หลาย toggles พร้อมกัน', desc: '1. เปิด 2 toggles', data: '-', exp: 'รับได้/ขัด business rule' },
  { id: 'J-PROD-CR074', cat: 'Note', obj: "Toggle 'แสดงหมายเหตุสินค้า'", desc: '1. ดู', data: '-', exp: 'มี toggle + อาจแสดง remark field' },

  { type: 'part', text: 'PART 3: หน้า Create - Sections อื่น' },
  { type: 'sub', text: 'O. Section รูปภาพ/วีดีโอ/360' },
  { id: 'J-PROD-CR080', cat: 'Media', obj: 'เปิด section', desc: '1. คลิก', data: '-', exp: 'แสดง drop zone' },
  { id: 'J-PROD-CR081', cat: 'Media', obj: 'Drop zone visible', desc: '1. ดู', data: '-', exp: "'ลากและวางไฟล์'" },
  { id: 'J-PROD-CR082', cat: 'Media', obj: 'รองรับ JPG/PNG/Video/360', desc: '1. ดู', data: '-', exp: 'หลายรูปแบบ' },
  { id: 'J-PROD-CR083', cat: 'Media', obj: 'Upload JPG', desc: '1. เลือกไฟล์', data: '-', exp: 'อัปโหลด + preview' },
  { id: 'J-PROD-CR084', cat: 'Media', obj: 'Upload หลายไฟล์', desc: '1. multiple', data: '-', exp: 'รับหลายไฟล์' },
  { id: 'J-PROD-CR085', cat: 'Media', obj: 'Upload oversized', desc: '1. > limit', data: '-', exp: 'reject' },
  { id: 'J-PROD-CR086', cat: 'Media', obj: 'Upload รูปแบบไม่รองรับ', desc: '1. PDF', data: '-', exp: 'reject' },
  { id: 'J-PROD-CR087', cat: 'Media', obj: 'ลบรูปที่อัปโหลด', desc: '1. คลิกลบ', data: '-', exp: 'รูปหาย' },
  { id: 'J-PROD-CR088', cat: 'Media', obj: 'จัดลำดับรูป (drag)', desc: '1. drag-drop', data: '-', exp: 'ลำดับเปลี่ยน' },

  { type: 'sub', text: 'P. Section ไฮไลท์/ฟีเจอร์' },
  { id: 'J-PROD-CR090', cat: 'Feature', obj: 'เปิด section', desc: '1. คลิก', data: '-', exp: 'แสดง editor' },
  { id: 'J-PROD-CR091', cat: 'Feature', obj: 'กรอกฟีเจอร์ TH', desc: '1. กรอก', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR092', cat: 'Feature', obj: 'กรอกฟีเจอร์ EN', desc: '1. กรอก', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR093', cat: 'Feature', obj: 'เพิ่ม feature item ใหม่', desc: '1. คลิกเพิ่ม', data: '-', exp: 'แสดง row ใหม่' },
  { id: 'J-PROD-CR094', cat: 'Feature', obj: 'ลบ feature item', desc: '1. คลิกลบ', data: '-', exp: 'หาย' },

  { type: 'sub', text: 'Q. Section คุณสมบัติ (Attributes)' },
  { id: 'J-PROD-CR100', cat: 'Attribute', obj: 'เปิด section', desc: '1. คลิก', data: '-', exp: 'แสดงฟิลด์/template' },
  { id: 'J-PROD-CR101', cat: 'Attribute', obj: 'เลือก template คุณสมบัติ', desc: '1. คลิก template', data: '-', exp: 'ฟิลด์ render ตาม template' },
  { id: 'J-PROD-CR102', cat: 'Attribute', obj: 'กรอกคุณสมบัติ', desc: '1. กรอก', data: '-', exp: 'รับ' },

  { type: 'sub', text: 'R. Section คลังสินค้าและราคา' },
  { id: 'J-PROD-CR110', cat: 'Inventory', obj: 'เปิด section', desc: '1. คลิก', data: '-', exp: 'แสดงฟิลด์ inventory + price' },
  { id: 'J-PROD-CR111', cat: 'Price', obj: 'กรอกราคา', desc: '1. กรอก 1000', data: '-', exp: 'รับค่า' },
  { id: 'J-PROD-CR112', cat: 'Price', obj: 'ราคา 0', desc: '1. 0', data: '-', exp: 'รับ 0 / error' },
  { id: 'J-PROD-CR113', cat: 'Price', obj: 'ราคา ทศนิยม', desc: '1. 99.50', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR114', cat: 'Price', obj: 'ราคา ลบ', desc: '1. -10', data: '-', exp: 'reject' },
  { id: 'J-PROD-CR115', cat: 'Stock', obj: 'กรอก stock', desc: '1. 10', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR116', cat: 'Stock', obj: 'Stock 0', desc: '1. 0', data: '-', exp: 'รับ 0' },
  { id: 'J-PROD-CR117', cat: 'Stock', obj: 'Stock ลบ', desc: '1. -1', data: '-', exp: 'reject' },
  { id: 'J-PROD-CR118', cat: 'Promotion', obj: 'ราคาในช่วงโปรโมชัน', desc: '1. ดูฟิลด์', data: '-', exp: 'อาจมี field promotion' },
  { id: 'J-PROD-CR119', cat: 'Discount', obj: 'ส่วนลด', desc: '1. ดู', data: '-', exp: 'อาจมี field' },
  { id: 'J-PROD-CR120', cat: 'ITECH', obj: 'การเชื่อมต่อ ITECH', desc: '1. ดู', data: '-', exp: 'มี indicator' },
  { id: 'J-PROD-CR121', cat: 'Supplier', obj: 'เลือก supplier', desc: '1. ดู combobox', data: '-', exp: 'มี supplier dropdown' },

  { type: 'sub', text: 'S. Section แท็กสินค้า' },
  { id: 'J-PROD-CR130', cat: 'Tag', obj: 'เปิด section', desc: '1. คลิก', data: '-', exp: 'แสดง tag picker' },
  { id: 'J-PROD-CR131', cat: 'Tag', obj: 'เลือก tag', desc: '1. คลิก', data: '-', exp: 'เลือกได้' },
  { id: 'J-PROD-CR132', cat: 'Tag', obj: 'ลบ tag', desc: '1. คลิกลบ', data: '-', exp: 'หาย' },
  { id: 'J-PROD-CR133', cat: 'Tag', obj: 'เลือกหลาย tags', desc: '1. เลือก 3', data: '-', exp: 'รับหลาย' },

  { type: 'sub', text: 'T. Section ตัวกรองสินค้า' },
  { id: 'J-PROD-CR140', cat: 'Filter-Product', obj: 'เปิด section', desc: '1. คลิก', data: '-', exp: 'แสดง filter selection' },
  { id: 'J-PROD-CR141', cat: 'Filter-Product', obj: 'เลือก filter', desc: '1. เลือก', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR142', cat: 'Filter-Product', obj: 'กรอกค่า filter', desc: '1. กรอก', data: '-', exp: 'รับ' },

  { type: 'sub', text: 'U. Section SEO' },
  { id: 'J-PROD-CR150', cat: 'SEO', obj: 'เปิด section', desc: '1. คลิก', data: '-', exp: 'แสดง SEO fields' },
  { id: 'J-PROD-CR151', cat: 'SEO', obj: 'Meta title TH/EN', desc: '1. กรอก', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR152', cat: 'SEO', obj: 'Meta description', desc: '1. กรอก', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR153', cat: 'SEO', obj: 'Slug/URL', desc: '1. กรอก', data: '-', exp: 'รับ' },
  { id: 'J-PROD-CR154', cat: 'SEO', obj: 'Meta keywords', desc: '1. กรอก', data: '-', exp: 'รับ' },

  { type: 'sub', text: 'V. Progress + ดูตัวอย่าง + บันทึก' },
  { id: 'J-PROD-CR160', cat: 'Progress', obj: 'Progress initial 0%', desc: '1. ดู', data: '-', exp: '0%' },
  { id: 'J-PROD-CR161', cat: 'Progress', obj: 'Progress update เมื่อกรอก', desc: '1. กรอกฟิลด์', data: '-', exp: '% เพิ่ม' },
  { id: 'J-PROD-CR162', cat: 'Progress', obj: 'Progress 100% เมื่อครบ', desc: '1. กรอกครบ', data: '-', exp: '100% / ข้อมูลครบถ้วน' },
  { id: 'J-PROD-CR163', cat: 'Preview', obj: "ปุ่ม 'ดูตัวอย่าง'", desc: '1. คลิก', data: '-', exp: 'แสดง preview' },
  { id: 'J-PROD-CR164', cat: 'Preview', obj: 'Preview card update เมื่อกรอก', desc: '1. กรอก + ดู card', data: '-', exp: 'update real-time' },
  { id: 'J-PROD-CR165', cat: 'Save', obj: 'บันทึกฟอร์มเปล่า', desc: '1. คลิก save ทันที', data: '-', exp: 'error ทุก required' },
  { id: 'J-PROD-CR166', cat: 'Save', obj: 'Happy path บันทึก', desc: '1. กรอกครบ required + save', data: '-', exp: 'Toast + redirect ไป list' },
  { id: 'J-PROD-CR167', cat: 'Save', obj: 'Save Double click', desc: '1. 2 ครั้งติด', data: '-', exp: 'disable + ไม่ duplicate' },
  { id: 'J-PROD-CR168', cat: 'Save', obj: 'Save Network ขาด', desc: '1. ตัด net + save', data: '-', exp: 'error' },
  { id: 'J-PROD-CR169', cat: 'Save', obj: 'Save Server 500', desc: '1. mock 500', data: '-', exp: 'error' },

  { type: 'sub', text: 'W. การยกเลิก / ออกจากหน้า' },
  { id: 'J-PROD-CR180', cat: 'Exit', obj: 'ออกโดย clean', desc: '1. breadcrumb back', data: '-', exp: 'กลับ list (ไม่ warning)' },
  { id: 'J-PROD-CR181', cat: 'Exit', obj: 'beforeunload dirty', desc: '1. กรอก + navigate', data: '-', exp: 'warning' },
  { id: 'J-PROD-CR182', cat: 'Exit', obj: 'Browser back dirty', desc: '1. back', data: '-', exp: 'warning' },
  { id: 'J-PROD-CR183', cat: 'Exit', obj: 'Refresh dirty', desc: '1. F5', data: '-', exp: 'warning' },

  { type: 'part', text: '⭐ PART 4: CRUD Cycle (สร้าง→แก้→ลบจริง)' },
  { id: 'J-PROD-CRUD001', cat: 'CRUD-Create', obj: 'สร้าง product ใหม่ผ่าน UI', desc: '1. /create | 2. กรอก SKU+ชื่อ TH+ขั้นต่ำ | 3. บันทึก', data: '-', exp: 'Toast + redirect' },
  { id: 'J-PROD-CRUD002', cat: 'CRUD-Verify', obj: 'ค้นหา record', desc: '1. ค้นหา SKU', data: '-', exp: 'พบ' },
  { id: 'J-PROD-CRUD010', cat: 'CRUD-Edit', obj: 'เปิด Edit + แก้ชื่อ + save', desc: '1. ดินสอ + แก้ + save', data: '-', exp: 'อัพเดต' },
  { id: 'J-PROD-CRUD011', cat: 'CRUD-Verify', obj: 'verify ชื่อใหม่', desc: '1. ค้นหา', data: '-', exp: 'พบ' },
  { id: 'J-PROD-CRUD020', cat: 'CRUD-Delete', obj: 'menu → ลบ → ยกเลิก', desc: '1. cancel', data: '-', exp: 'ปิด dialog ยังอยู่' },
  { id: 'J-PROD-CRUD021', cat: 'CRUD-Delete', obj: 'ยืนยันลบ', desc: '1. confirm', data: '-', exp: 'หาย/ย้ายไป trash' },
  { id: 'J-PROD-CRUD022', cat: 'CRUD-Verify', obj: 'verify หาย', desc: '1. ค้นหา', data: '-', exp: 'ไม่พบ' },
  { id: 'J-PROD-CRUD030', cat: 'CRUD-Trash', obj: 'ดู Tab ถังขยะ', desc: '1. Tab ถังขยะ', data: '-', exp: 'พบ record ที่ลบ' },

  { type: 'part', text: 'PART 5: หน้า Edit' },
  { id: 'J-PROD-ED001', cat: 'Edit-Open', obj: 'เปิด Edit ผ่าน ดินสอ', desc: '1. คลิก', data: '-', exp: '/update/{id}' },
  { id: 'J-PROD-ED002', cat: 'Edit-Open', obj: 'เปิด URL ตรง', desc: '1. URL', data: '-', exp: 'หน้าโหลด' },
  { id: 'J-PROD-ED003', cat: 'Edit-Open', obj: 'Header แก้ไข', desc: '1. ดู', data: '-', exp: "'แก้ไข' + 'ระบุรายละเอียดต่างๆ เพื่อแก้ไขสินค้าในระบบ'" },
  { id: 'J-PROD-ED004', cat: 'Edit-Open', obj: 'โหลดข้อมูลเดิม', desc: '1. ดูฟิลด์', data: '-', exp: 'ตรงกับ record' },
  { id: 'J-PROD-ED005', cat: 'Edit-Open', obj: 'Progress update เมื่อโหลด', desc: '1. ดู indicator', data: '-', exp: '% ตามฟิลด์ที่กรอก' },
  { id: 'J-PROD-ED006', cat: 'Edit-Open', obj: 'Invalid ID', desc: '1. /update/99999999', data: '-', exp: '404/redirect' },
  { id: 'J-PROD-ED010', cat: 'Edit-Update', obj: 'แก้ชื่อ + save', desc: '1. แก้ + save', data: '-', exp: 'อัพเดต' },
  { id: 'J-PROD-ED011', cat: 'Edit-Update', obj: 'แก้ราคา + save', desc: '1. แก้ + save', data: '-', exp: 'อัพเดต' },
  { id: 'J-PROD-ED012', cat: 'Edit-Update', obj: 'แก้ stock + save', desc: '1. แก้ + save', data: '-', exp: 'อัพเดต' },
  { id: 'J-PROD-ED013', cat: 'Edit-Update', obj: 'เปลี่ยนหมวดหมู่', desc: '1. เปลี่ยน + save', data: '-', exp: 'อัพเดต' },
  { id: 'J-PROD-ED014', cat: 'Edit-Update', obj: 'เปิด/ปิด product type toggle', desc: '1. toggle + save', data: '-', exp: 'อัพเดต' },
  { id: 'J-PROD-ED015', cat: 'Edit-Update', obj: 'เคลียร์ฟิลด์ required + save', desc: '1. clear + save', data: '-', exp: 'error' },
  { id: 'J-PROD-ED016', cat: 'Edit-Cancel', obj: 'แก้แล้วยกเลิก', desc: '1. แก้ + visit list', data: '-', exp: 'ค่าเดิมไม่เปลี่ยน' },
  { id: 'J-PROD-ED020', cat: 'Edit-Menu', obj: '3-dot menu บน Edit', desc: '1. คลิก', data: '-', exp: 'menu items' },

  { type: 'part', text: 'PART 6: UI/UX + Permission/Security' },
  { id: 'J-PROD-UX001', cat: 'Responsive', obj: 'Desktop 1920', desc: '1. 1920', data: '-', exp: 'Layout ปกติ' },
  { id: 'J-PROD-UX002', cat: 'Responsive', obj: 'Tablet 768', desc: '1. 768', data: '-', exp: 'Responsive' },
  { id: 'J-PROD-UX003', cat: 'Responsive', obj: 'Mobile 375', desc: '1. 375', data: '-', exp: 'Responsive' },
  { id: 'J-PROD-UX004', cat: 'Browser-Chrome', obj: 'Chrome', desc: '1. test', data: '-', exp: 'ทำงาน' },
  { id: 'J-PROD-UX005', cat: 'Browser-Firefox', obj: 'Firefox', desc: '1. test', data: '-', exp: 'ทำงาน' },
  { id: 'J-PROD-UX006', cat: 'Browser-Safari', obj: 'Safari', desc: '1. test', data: '-', exp: 'ทำงาน' },
  { id: 'J-PROD-UX007', cat: 'Browser-Edge', obj: 'Edge', desc: '1. test', data: '-', exp: 'ทำงาน' },
  { id: 'J-PROD-UX008', cat: 'Accessibility', obj: 'Tab navigation', desc: '1. Tab', data: '-', exp: 'Focus ตามลำดับ' },
  { id: 'J-PROD-UX009', cat: 'Accessibility', obj: 'Enter behavior', desc: '1. Enter', data: '-', exp: 'ไม่ submit อัตโนมัติ' },
  { id: 'J-PROD-UX010', cat: 'Loading', obj: 'Loading skeleton', desc: '1. load', data: '-', exp: 'skeleton ปรากฏ' },
  { id: 'J-PROD-SEC001', cat: 'Permission-NoLogin', obj: 'ไม่ login → URL', desc: '1. logout + URL', data: '-', exp: 'redirect login' },
  { id: 'J-PROD-SEC002', cat: 'Permission-NoPerm', obj: 'No permission user', desc: '1. login no-perm', data: '-', exp: '403/ซ่อนปุ่ม' },
  { id: 'J-PROD-SEC003', cat: 'Session-Timeout', obj: 'Session timeout', desc: '1. รอ timeout + save', data: '-', exp: 'redirect login' },
  { id: 'J-PROD-SEC004', cat: 'XSS-Display', obj: 'XSS display ใน list', desc: '1. สร้างชื่อ <script>', data: '-', exp: 'เป็น text' },
  { id: 'J-PROD-SEC005', cat: 'CSRF', obj: 'CSRF token', desc: '1. ตรวจ', data: '-', exp: 'มี token' },
]

function field(s) { if (s == null) return ''; s = String(s); if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`; return s }
const blank = ',,,,,,,'
const sectionRow = (text) => `${field(text)},,,,,,,`

const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
const lines = [
  `Project Name :,JIB-Ecommerce,,,Create Date :,2026-06-01,,`,
  `Project ID :,,,,Start Test Date :,2026-06-01,,`,
  `Tester Name :,admin zero,,,Finish Test Date :,2026-06-01,,`,
  `Project Release / Version :,1.0,,,Module / Function :,${field('สินค้า (Products) - List + Create + Edit + 8 Sections + CRUD')},,`,
  `URL List :,https://devstorex.jibc.codelabdev.co/store/product-manager/products,,,,,,`,
  `URL Create :,https://devstorex.jibc.codelabdev.co/store/product-manager/products/create,,,,,,`,
  `URL Edit :,${field('https://devstorex.jibc.codelabdev.co/store/product-manager/products/update/{id}')},,,,,,`,
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
lines.push(`,${field('2. สินค้า = ฟอร์มที่ซับซ้อนที่สุดในระบบ: 8 sections (ข้อมูลทั่วไป/รูปภาพ/ไฮไลท์/คุณสมบัติ/คลังสินค้า/แท็ก/ตัวกรอง/SEO) + 3 product type toggles + 34 columns + 10 tabs filter')},,,,,,`)
lines.push(`,${field('3. ⭐ PART 4 CRUD: สร้าง record จริง → แก้ไขจริง → ลบจริง (อาจย้ายไป trash)')},,,,,,`)
lines.push(`,${field('4. หลายเคสในส่วน Sections พิเศษ (รูปภาพ/คุณสมบัติ/Inventory/SEO) ทดสอบได้ยากใน automated session - จะเป็น Not Tested ส่วนใหญ่')},,,,,,`)
lines.push(`,${field('5. Sections "-- ... --" ใช้ตัวคั่นมาตรฐาน (ไม่ใช้ #/=) ตามรูปแบบ test case JIB')},,,,,,`)

fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log('products: total defined=', ROWS.filter((r) => r.id).length, '|', sum, '| pass rate:', passRate + '%')
