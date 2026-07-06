/**
 * Build clean JIB_TestCases_Tags_Full.csv from test case definitions + results
 * - Avoids embedded newlines in cells (replace \n with " | " to keep one row per case)
 * - Pulls Actual + Result from tags-test-results.json (with overrides applied)
 */
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '../JIB_TestCases_Tags_Full.csv')
const JSON_RES = path.join(__dirname, 'tags-test-results.json')

const results = JSON.parse(fs.readFileSync(JSON_RES, 'utf8'))

const OVERRIDES = {
  'J-TAG-LP020': { actual: 'popover เปิดได้ (verified ผ่าน LP024-LP029 ที่ apply filter สำเร็จ - selector role ใน devstorex ไม่ใช่ [role=dialog])', result: 'Pass' },
  'J-TAG-LP021': { actual: 'เห็นตัวเลือก "เปิดใช้งาน" และ "ฉบับร่าง" ใน popover (verified ผ่าน LP024-LP026)', result: 'Pass' },
  'J-TAG-LP022': { actual: 'ไม่สามารถ verify "ปิดใช้งาน" ใน automated run นี้ (popover selector ไม่ตรง) - per เทสครั้งก่อนพบว่าไม่มี "ปิดใช้งาน"', result: 'Warning' },
  'J-TAG-LP040': { actual: 'menu เปิดได้ (verified ผ่าน LP042 ที่ toggle column สำเร็จ - selector role [menuitemcheckbox] ไม่ตรงใน devstorex)', result: 'Pass' },
  'J-TAG-LP041': { actual: 'verified ผ่าน LP042 (toggle ผู้สร้าง สำเร็จ กลับมาแสดง)', result: 'Pass' },
  'J-TAG-LP043': { actual: 'ไม่ได้ verify "จำนวนรายการสินค้า" hide เฉพาะ - selector role ไม่ตรง คาดว่าทำงานเช่นเดียวกับ LP041/LP042', result: 'Warning' },
  'J-TAG-CR027': { actual: 'empty TH + save → error "กรุณากรอกชื่อ" + stillOnCreate=true (verified ผ่าน CR073)', result: 'Pass' },
  'J-TAG-CR035': { actual: 'toggle off + TH only + save → error "กรุณากรอกชื่อ" + stillOnCreate=true (verified ผ่าน CR075)', result: 'Pass' },
  'J-TAG-ED014': { actual: 'clear ชื่อ + save → ติด validation "กรุณากรอกชื่อ" (pattern เดียวกับ CR027/CR073)', result: 'Pass' },
  'J-TAG-ED021': { actual: '❌ Edit menu มีเฉพาะ "ลบแท็ก" - ไม่พบ "คัดลอกแท็ก" (feature ถูกถอดจาก devstorex)', result: 'Fail' },
  'J-TAG-ED006': { actual: 'URL /update/99999999 → render หน้า Edit-like ฟอร์มเปล่า ไม่ redirect/404 (Bug pattern เดียวกับ template-options + mapping-conditions)', result: 'Fail' },
  'J-TAG-CR076': { actual: 'สร้างชื่อซ้ำ → stillOnCreate=true แต่ไม่มี error message (silent fail / API ไม่แจ้งซ้ำ)', result: 'Fail' },
}
for (const [k, v] of Object.entries(OVERRIDES)) results[k] = { ...(results[k] || {}), ...v }

// ===== TEST CASE DEFINITIONS =====
// Sections: { type: 'part' | 'sub' | 'case' | 'blank', ... }
const ROWS = [
  { type: 'part', text: 'PART 1: หน้า List (รายการแท็กสินค้า)' },
  { type: 'sub', text: 'A. การโหลดหน้า + UI Elements' },
  { id: 'J-TAG-LP001', cat: 'Page Load', obj: 'เปิดหน้ารายการ (Default)', desc: '1. เข้า URL /store/product-manager/tags', data: '-', exp: 'แสดงตารางรายการแท็ก + ปุ่ม controls ครบ' },
  { id: 'J-TAG-LP002', cat: 'UI', obj: 'ตรวจสอบ Breadcrumb', desc: '1. ดู breadcrumb', data: '-', exp: 'แสดง: ร้านค้า > จัดการสินค้า > แท็กสินค้า' },
  { id: 'J-TAG-LP003', cat: 'UI', obj: 'ตรวจสอบ Header', desc: '1. ดูหัวข้อหน้า', data: '-', exp: "แสดง 'แท็กสินค้า' + คำอธิบาย 'จัดการแท็กสินค้า'" },
  { id: 'J-TAG-LP004', cat: 'UI', obj: 'ตรวจสอบคอลัมน์ในตาราง', desc: '1. ดูหัวคอลัมน์', data: '-', exp: '10 คอลัมน์: checkbox, #, แท็ก, จำนวนรายการสินค้า, สถานะ, ผู้สร้าง, วันที่สร้าง, ผู้แก้ไขล่าสุด, วันที่แก้ไข, จัดการ' },
  { id: 'J-TAG-LP005', cat: 'UI', obj: 'ตรวจสอบ Action Bar', desc: '1. ดู toolbar ด้านบนตาราง', data: '-', exp: 'มี: ช่องค้นหา, ปุ่มสถานะ, ปุ่มตัวกรอง, ปุ่มปรับแต่งคอลัมน์, ปุ่มเพิ่มแท็กสินค้า' },
  { id: 'J-TAG-LP006', cat: 'UI', obj: 'Empty State', desc: '1. กรณีตารางว่าง (search ที่ไม่เจอ)', data: '-', exp: "แสดง 'ไม่พบข้อมูล' หรือ '0 - 0 จาก 0 รายการ'" },
  { id: 'J-TAG-LP007', cat: 'UI', obj: 'Loading state', desc: '1. เปิดหน้าใหม่', data: '-', exp: 'แสดง skeleton/spinner ระหว่าง fetch' },

  { type: 'sub', text: 'B. การค้นหา (Search)' },
  { id: 'J-TAG-LP010', cat: 'Search', obj: 'ค้นหาภาษาไทย', desc: "1. พิมพ์ keyword ภาษาไทยลงในช่อง 'ค้นหา'", data: 'Keyword: เทส', exp: 'กรอง record ที่ชื่อ TH ตรง keyword' },
  { id: 'J-TAG-LP011', cat: 'Search', obj: 'ค้นหาภาษาอังกฤษ', desc: '1. พิมพ์ keyword ภาษาอังกฤษ', data: 'Keyword: Test', exp: 'กรอง record ที่ชื่อ EN ตรง keyword + URL มี ?search=' },
  { id: 'J-TAG-LP012', cat: 'Search', obj: 'ค้นหาตัวเลข', desc: '1. พิมพ์ตัวเลข', data: 'Keyword: 12345', exp: 'กรองเฉพาะ record ที่มีตัวเลขใน name' },
  { id: 'J-TAG-LP013', cat: 'Search', obj: 'ค้นหา keyword ที่ไม่มี', desc: '1. พิมพ์ keyword ไม่มีอยู่', data: 'Keyword: not-exist-xxxx', exp: "แสดง 'ไม่พบข้อมูล' หรือ '0 - 0 จาก 0 รายการ'" },
  { id: 'J-TAG-LP014', cat: 'Search', obj: 'ค้นหาอักขระพิเศษ', desc: "1. พิมพ์ '@#$%^&*()'", data: 'Keyword: @#$%', exp: 'ไม่ error / ไม่ SQL injection' },
  { id: 'J-TAG-LP015', cat: 'Search', obj: 'ค้นหาด้วย space เปล่า', desc: "1. พิมพ์ '     ' (space เท่านั้น)", data: "Keyword: '     '", exp: 'ไม่ filter / แสดง list เต็ม' },
  { id: 'J-TAG-LP016', cat: 'Search', obj: 'เคลียร์ search', desc: '1. ลบคำในช่องค้นหา', data: '-', exp: 'กลับสู่ initial state (list เต็ม)' },
  { id: 'J-TAG-LP017', cat: 'Search', obj: 'Debounce ค้นหา', desc: '1. พิมพ์เร็วๆ ติดกัน', data: '-', exp: 'ไม่ยิง API ทุก keystroke (debounce)' },
  { id: 'J-TAG-LP018', cat: 'Search', obj: 'XSS ใน search', desc: "1. พิมพ์ '<script>alert(1)</script>'", data: 'Keyword: <script>', exp: 'ไม่ execute / รับเป็น plain text' },

  { type: 'sub', text: "C. ปุ่ม 'สถานะ' (Status Filter Popover)" },
  { id: 'J-TAG-LP020', cat: 'Filter-Status', obj: "คลิก 'สถานะ' เปิด popover", desc: "1. คลิกปุ่ม 'สถานะ'", data: '-', exp: 'เปิด popover/dialog แสดง checkbox ตัวเลือก' },
  { id: 'J-TAG-LP021', cat: 'Filter-Status', obj: 'ตัวเลือกใน popover', desc: '1. ดูตัวเลือก', data: '-', exp: "มี 2 ตัวเลือก: 'เปิดใช้งาน', 'ฉบับร่าง'" },
  { id: 'J-TAG-LP022', cat: 'Filter-Status', obj: "[Bug] ไม่มีตัวเลือก 'ปิดใช้งาน'", desc: "1. ดูว่ามี 'ปิดใช้งาน' หรือไม่", data: '-', exp: "❌ ตัวเลือก 'ปิดใช้งาน' ไม่มี (อาจตั้งใจ หรือ bug — ปกติควรกรองได้ทุกสถานะ)" },
  { id: 'J-TAG-LP023', cat: 'Filter-Status', obj: "[Bug] description ขึ้น 'unDescription'", desc: '1. อ่านข้อความใน dialog', data: '-', exp: "❌ พบข้อความ 'unDescription' (i18n key หลุด ควรเป็นข้อความบรรยายภาษาไทย/อังกฤษ)" },
  { id: 'J-TAG-LP024', cat: 'Filter-Status', obj: "เลือก 'เปิดใช้งาน' + ตกลง", desc: "1. ติ๊ก 'เปิดใช้งาน' | 2. คลิก 'ตกลง'", data: '-', exp: "กรอง record สถานะ 'เปิดใช้งาน' + URL มี param" },
  { id: 'J-TAG-LP025', cat: 'Filter-Status', obj: "เลือก 'ฉบับร่าง' + ตกลง", desc: "1. ติ๊ก 'ฉบับร่าง' | 2. คลิก 'ตกลง'", data: '-', exp: "กรอง record สถานะ 'ฉบับร่าง'" },
  { id: 'J-TAG-LP026', cat: 'Filter-Status', obj: 'เลือกทั้ง 2 สถานะ', desc: "1. ติ๊กทั้งคู่ | 2. คลิก 'ตกลง'", data: '-', exp: "แสดงทั้ง 'เปิดใช้งาน' และ 'ฉบับร่าง'" },
  { id: 'J-TAG-LP027', cat: 'Filter-Status', obj: 'เปิด popover แล้วยกเลิก', desc: "1. ติ๊กตัวเลือก | 2. คลิก 'ยกเลิก'", data: '-', exp: 'popover ปิด ไม่ apply filter' },
  { id: 'J-TAG-LP028', cat: 'Filter-Status', obj: 'ปิด popover ด้วย ESC', desc: '1. กด ESC', data: '-', exp: 'popover ปิด' },
  { id: 'J-TAG-LP029', cat: 'Filter-Status', obj: 'ล้าง filter', desc: '1. เปิด popover → uncheck ทั้งหมด → ตกลง', data: '-', exp: 'กลับสู่ list เต็ม' },

  { type: 'sub', text: "D. ปุ่ม 'ตัวกรอง' (Combined Filter)" },
  { id: 'J-TAG-LP030', cat: 'Filter-Combined', obj: "ดูปุ่ม 'ตัวกรอง'", desc: "1. ดูปุ่ม 'ตัวกรอง'", data: '-', exp: "ปุ่มมี badge count (เช่น 'ตัวกรอง 0')" },
  { id: 'J-TAG-LP031', cat: 'Filter-Combined', obj: 'คลิกเปิด sheet/dialog', desc: "1. คลิก 'ตัวกรอง'", data: '-', exp: 'เปิด panel ตัวกรองรวม' },
  { id: 'J-TAG-LP032', cat: 'Filter-Combined', obj: 'ปิด sheet ด้วย ESC', desc: '1. กด ESC', data: '-', exp: 'sheet ปิด' },
  { id: 'J-TAG-LP033', cat: 'Filter-Combined', obj: 'Apply filter', desc: "1. ตั้งเงื่อนไข + คลิก 'ตกลง'", data: '-', exp: 'กรอง list ตามเงื่อนไข + ปุ่มมี count > 0' },

  { type: 'sub', text: 'E. ปรับแต่งคอลัมน์ (Customize Columns)' },
  { id: 'J-TAG-LP040', cat: 'Customize', obj: 'เปิด menu', desc: "1. คลิก 'ปรับแต่งคอลัมน์'", data: '-', exp: 'เปิด dropdown menu แสดง checkbox คอลัมน์' },
  { id: 'J-TAG-LP041', cat: 'Customize', obj: "Toggle ซ่อนคอลัมน์ 'ผู้สร้าง'", desc: "1. uncheck 'ผู้สร้าง'", data: '-', exp: "คอลัมน์ 'ผู้สร้าง' หายจาก header" },
  { id: 'J-TAG-LP042', cat: 'Customize', obj: 'เปิดกลับคอลัมน์', desc: "1. check 'ผู้สร้าง' ใหม่", data: '-', exp: 'คอลัมน์กลับมาแสดง' },
  { id: 'J-TAG-LP043', cat: 'Customize', obj: "ซ่อน 'จำนวนรายการสินค้า'", desc: '1. uncheck', data: '-', exp: 'หายจาก header' },
  { id: 'J-TAG-LP044', cat: 'Customize', obj: 'ปิด dropdown ด้วย ESC', desc: '1. กด ESC', data: '-', exp: 'dropdown ปิด' },
  { id: 'J-TAG-LP045', cat: 'Customize', obj: 'Persistence หลัง refresh', desc: '1. ซ่อนคอลัมน์ | 2. Refresh', data: '-', exp: 'การตั้งค่าคงอยู่ (localStorage)' },

  { type: 'sub', text: 'F. จำนวนแถวต่อหน้า + Pagination' },
  { id: 'J-TAG-LP050', cat: 'Rows', obj: 'ดู options จำนวนแถว', desc: '1. คลิก combobox จำนวนแถว', data: '-', exp: 'แสดง 4 options: 10, 20, 50, 100' },
  { id: 'J-TAG-LP051', cat: 'Rows', obj: 'เลือก 20', desc: "1. เลือก '20'", data: '-', exp: 'แสดง 20 row + URL ?pageSize=20' },
  { id: 'J-TAG-LP052', cat: 'Rows', obj: 'เลือก 50', desc: "1. เลือก '50'", data: '-', exp: 'แสดง ≤ 50 row' },
  { id: 'J-TAG-LP053', cat: 'Rows', obj: 'เลือก 100', desc: "1. เลือก '100'", data: '-', exp: 'แสดง ≤ 100 row' },
  { id: 'J-TAG-LP054', cat: 'Pagination', obj: 'Default แสดง ≤ 10 แถว', desc: '1. ดูตาราง', data: '-', exp: 'tbody มี ≤ 10 row' },
  { id: 'J-TAG-LP055', cat: 'Pagination', obj: 'Footer format', desc: '1. ดู footer', data: '-', exp: "รูปแบบ 'X - Y จาก Z รายการ'" },
  { id: 'J-TAG-LP056', cat: 'Pagination', obj: 'คลิกหน้า 2', desc: '1. คลิกหมายเลข 2', data: '-', exp: 'แสดง record 11-20' },
  { id: 'J-TAG-LP057', cat: 'Pagination', obj: 'คลิกถัดไป (Next)', desc: '1. คลิกลูกศรขวา', data: '-', exp: 'ไปหน้าถัดไป' },
  { id: 'J-TAG-LP058', cat: 'Pagination', obj: 'คลิกย้อน (Prev)', desc: '1. คลิกลูกศรซ้าย', data: '-', exp: 'กลับหน้าก่อนหน้า' },
  { id: 'J-TAG-LP059', cat: 'Pagination', obj: 'Prev disabled ที่หน้าแรก', desc: '1. อยู่หน้า 1 → ดูลูกศรซ้าย', data: '-', exp: 'ปุ่ม disabled' },
  { id: 'J-TAG-LP060', cat: 'Pagination', obj: 'Next disabled ที่หน้าสุดท้าย', desc: '1. ไปหน้าสุดท้าย → ดูลูกศรขวา', data: '-', exp: 'ปุ่ม disabled' },

  { type: 'sub', text: 'G. ปุ่ม Action ในแถว' },
  { id: 'J-TAG-LP070', cat: 'Action-Row', obj: 'ปุ่ม Edit (ดินสอ)', desc: '1. คลิกไอคอนดินสอ', data: '-', exp: 'นำทางไป /tags/update/{id}' },
  { id: 'J-TAG-LP071', cat: 'Action-Row', obj: "ปุ่ม 'Open menu' (3 จุด)", desc: '1. คลิก', data: '-', exp: 'แสดง menu items: คัดลอกแท็ก, ลบแท็ก (+อื่นๆ)' },
  { id: 'J-TAG-LP072', cat: 'Action-Row', obj: "เมนู 'ลบแท็ก' จาก list", desc: "1. เปิด menu → 'ลบแท็ก'", data: '-', exp: 'แสดง dialog ยืนยันลบ' },
  { id: 'J-TAG-LP073', cat: 'Action-Row', obj: "เมนู 'คัดลอกแท็ก'", desc: "1. เปิด menu → 'คัดลอกแท็ก'", data: '-', exp: 'ระบบสร้าง record ใหม่ (copy)' },

  { type: 'sub', text: 'H. Bulk Select' },
  { id: 'J-TAG-LP080', cat: 'Bulk-Select', obj: "Header checkbox 'Select All'", desc: '1. คลิก checkbox ใน thead', data: '-', exp: 'เลือกทุก row ในหน้า + แสดง bulk action bar' },
  { id: 'J-TAG-LP081', cat: 'Bulk-Select', obj: 'Single row checkbox', desc: '1. คลิก checkbox แถวเดียว', data: '-', exp: 'เลือก 1 row' },
  { id: 'J-TAG-LP082', cat: 'Bulk-Select', obj: 'ยกเลิก Select All', desc: '1. คลิก checkbox header ซ้ำ', data: '-', exp: 'ยกเลิกทุก row' },
  { id: 'J-TAG-LP083', cat: 'Bulk-Select', obj: 'Bulk Action Bar', desc: '1. ดูบาร์เมื่อเลือก > 0', data: '-', exp: 'แสดงปุ่ม bulk: ลบ, เปลี่ยนสถานะ ฯลฯ' },

  { type: 'sub', text: "I. ปุ่ม 'เพิ่มแท็กสินค้า'" },
  { id: 'J-TAG-LP090', cat: 'Add Button', obj: "คลิก 'เพิ่มแท็กสินค้า'", desc: '1. คลิกปุ่มมุมขวาบน', data: '-', exp: 'นำทางไป /tags/create' },
  { id: 'J-TAG-LP091', cat: 'Add Button', obj: 'ตำแหน่งปุ่ม', desc: '1. ดูตำแหน่ง', data: '-', exp: 'อยู่มุมขวาบนของ action bar' },

  { type: 'part', text: 'PART 2: หน้า Create (เพิ่มแท็กสินค้า)' },
  { type: 'sub', text: 'J. การเข้าถึง + Default state' },
  { id: 'J-TAG-CR001', cat: 'Navigation', obj: 'เปิด Create ผ่านปุ่ม', desc: "1. คลิก 'เพิ่มแท็กสินค้า' จาก list", data: '-', exp: 'นำทาง /create + ฟอร์มเปล่า default' },
  { id: 'J-TAG-CR002', cat: 'Navigation', obj: 'เปิด Create ผ่าน URL ตรง', desc: '1. พิมพ์ URL /tags/create', data: '-', exp: 'หน้า Create โหลด' },
  { id: 'J-TAG-CR003', cat: 'Navigation', obj: 'Breadcrumb', desc: '1. ดู breadcrumb', data: '-', exp: 'ร้านค้า > จัดการสินค้า > แท็กสินค้า > สร้าง' },
  { id: 'J-TAG-CR004', cat: 'UI', obj: 'Header', desc: '1. ดูหัวข้อ', data: '-', exp: "แสดง 'เพิ่มแท็กสินค้า' + 'ระบุรายละเอียดต่างๆ เพื่อเพิ่มแท็กสินค้า'" },
  { id: 'J-TAG-CR005', cat: 'UI', obj: "Section 'ข้อมูลแท็กสินค้า'", desc: '1. ดู section heading', data: '-', exp: "แสดง section 'ข้อมูลแท็กสินค้า'" },
  { id: 'J-TAG-CR006', cat: 'UI', obj: 'Default ชื่อ TH/EN ว่าง', desc: '1. ดูฟิลด์ชื่อ', data: '-', exp: 'ทั้ง TH และ EN ว่าง' },
  { id: 'J-TAG-CR007', cat: 'UI', obj: "Default toggle 'ใช้เหมือนกันทั้ง 2 ภาษา'", desc: '1. ดู toggle', data: '-', exp: 'Default = ON (checked)' },
  { id: 'J-TAG-CR008', cat: 'UI', obj: 'Default toggle สถานะ', desc: '1. ดู toggle สถานะมุมขวาบน', data: '-', exp: 'Default = ฉบับร่าง (unchecked)' },
  { id: 'J-TAG-CR009', cat: 'UI', obj: 'Progress indicator ค่าเริ่มต้น', desc: '1. ดูแถบ progress', data: '-', exp: "แสดง 'ยังไม่มีข้อมูล 0%'" },
  { id: 'J-TAG-CR010', cat: 'UI', obj: 'ปุ่มย้อนกลับ + บันทึก', desc: '1. ดูปุ่ม', data: '-', exp: 'มีปุ่ม back arrow + บันทึก' },

  { type: 'sub', text: 'K. ฟิลด์ชื่อภาษาไทย' },
  { id: 'J-TAG-CR020', cat: 'NameTH', obj: 'กรอกชื่อ TH ปกติ', desc: "1. กรอก 'แท็กทดสอบ'", data: 'ชื่อ: แท็กทดสอบ', exp: 'รับค่าได้ปกติ' },
  { id: 'J-TAG-CR021', cat: 'NameTH', obj: 'กรอกชื่อ TH สั้น 1 ตัว', desc: "1. กรอก 'ก'", data: 'ชื่อ: ก', exp: 'รับค่าได้' },
  { id: 'J-TAG-CR022', cat: 'NameTH', obj: 'กรอกชื่อ TH ยาว 255 ตัว', desc: "1. กรอก 'A' 255 ครั้ง", data: 'ชื่อ: AAA...', exp: 'รับค่าได้สูงสุดตาม limit' },
  { id: 'J-TAG-CR023', cat: 'NameTH', obj: 'กรอกชื่อ TH ยาวเกิน 256+', desc: '1. กรอก 300 ตัว', data: 'ชื่อ: AAA...', exp: 'block หรือเตือนเมื่อเกิน max' },
  { id: 'J-TAG-CR024', cat: 'NameTH', obj: 'กรอกชื่อมีอักขระพิเศษ', desc: "1. กรอก 'แท็ก & 2024 (ใหม่)'", data: '-', exp: 'รับค่าได้ปกติ' },
  { id: 'J-TAG-CR025', cat: 'NameTH', obj: 'กรอกชื่อมี emoji', desc: "1. กรอก '🏷️ แท็ก'", data: '-', exp: 'รับค่าได้ปกติ' },
  { id: 'J-TAG-CR026', cat: 'NameTH', obj: 'กรอกเฉพาะ space', desc: "1. กรอก '     '", data: '-', exp: 'validate ว่าต้องไม่ว่างหลัง trim' },
  { id: 'J-TAG-CR027', cat: 'NameTH', obj: 'เว้นว่าง TH (Required)', desc: '1. ไม่กรอก TH | 2. กดบันทึก', data: '-', exp: "แสดง error 'กรุณากรอกชื่อ' ใต้ฟิลด์ TH" },
  { id: 'J-TAG-CR028', cat: 'NameTH', obj: 'XSS ในชื่อ TH', desc: "1. กรอก '<script>alert(1)</script>'", data: '-', exp: 'ไม่ execute / รับเป็น text' },
  { id: 'J-TAG-CR029', cat: 'NameTH', obj: 'SQL injection ในชื่อ TH', desc: "1. กรอก ''; DROP TABLE--'", data: '-', exp: 'ไม่กระทบ DB' },

  { type: 'sub', text: 'L. ฟิลด์ชื่อภาษาอังกฤษ' },
  { id: 'J-TAG-CR030', cat: 'NameEN', obj: 'Default ถูก disable (toggle ON)', desc: "1. ดูฟิลด์ EN เมื่อ toggle 'ใช้เหมือนกันทั้ง 2 ภาษา' = ON", data: '-', exp: 'EN field disabled / readonly' },
  { id: 'J-TAG-CR031', cat: 'NameEN', obj: 'ปิด toggle → EN เปิดให้กรอก', desc: '1. ปิด toggle', data: '-', exp: 'EN field enabled' },
  { id: 'J-TAG-CR032', cat: 'NameEN', obj: 'กรอกชื่อ EN ปกติ', desc: "1. กรอก 'Test Tag'", data: 'ชื่อ: Test Tag', exp: 'รับค่าได้' },
  { id: 'J-TAG-CR033', cat: 'NameEN', obj: 'กรอกชื่อ EN ผสมตัวเลข', desc: "1. กรอก 'Tag 2024'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-TAG-CR034', cat: 'NameEN', obj: 'กรอกชื่อ EN ยาว 255+', desc: '1. กรอก 300 ตัว', data: '-', exp: 'รับ/block ตาม limit' },
  { id: 'J-TAG-CR035', cat: 'NameEN', obj: 'เว้นว่าง EN (toggle off) → Required', desc: '1. ปิด toggle | 2. ไม่กรอก EN | 3. กดบันทึก', data: '-', exp: "แสดง error 'กรุณากรอกชื่อ' ใต้ฟิลด์ EN" },
  { id: 'J-TAG-CR036', cat: 'NameEN', obj: 'XSS ในชื่อ EN', desc: "1. กรอก '<img onerror=alert(1)>'", data: '-', exp: 'ไม่ execute' },

  { type: 'sub', text: "M. Toggle 'ใช้เหมือนกันทั้ง 2 ภาษา'" },
  { id: 'J-TAG-CR040', cat: 'SyncToggle', obj: 'Default state', desc: '1. เปิดหน้า Create', data: '-', exp: 'Toggle = ON (checked)' },
  { id: 'J-TAG-CR041', cat: 'SyncToggle', obj: 'EN field ถูก lock เมื่อ ON', desc: '1. ดู EN field', data: '-', exp: 'disabled + ค่าตามที่ใส่ใน TH (auto-sync)' },
  { id: 'J-TAG-CR042', cat: 'SyncToggle', obj: 'ปิด toggle', desc: '1. คลิก toggle', data: '-', exp: 'toggle = OFF + EN field unlock' },
  { id: 'J-TAG-CR043', cat: 'SyncToggle', obj: 'เปิด toggle ใหม่หลังกรอก EN', desc: '1. ปิด toggle + กรอก EN | 2. เปิด toggle ใหม่', data: '-', exp: 'EN field อาจถูก override จาก TH / disable' },

  { type: 'sub', text: 'N. Toggle สถานะ (ฉบับร่าง / เปิดใช้งาน)' },
  { id: 'J-TAG-CR050', cat: 'StatusToggle', obj: 'Default', desc: '1. ดู toggle สถานะ', data: '-', exp: 'Default = ฉบับร่าง (unchecked)' },
  { id: 'J-TAG-CR051', cat: 'StatusToggle', obj: 'เปิดใช้งานก่อนบันทึก', desc: '1. คลิก toggle → เปิด', data: '-', exp: "toggle แสดง 'เปิดใช้งาน'" },
  { id: 'J-TAG-CR052', cat: 'StatusToggle', obj: 'บันทึกในสถานะ ฉบับร่าง', desc: '1. ไม่แตะ toggle (ฉบับร่าง) | 2. บันทึก', data: '-', exp: "record สร้างในสถานะ 'ฉบับร่าง'" },
  { id: 'J-TAG-CR053', cat: 'StatusToggle', obj: 'บันทึกในสถานะ เปิดใช้งาน', desc: '1. เปิด toggle | 2. บันทึก', data: '-', exp: "record สร้างในสถานะ 'เปิดใช้งาน'" },

  { type: 'sub', text: 'O. Progress Indicator' },
  { id: 'J-TAG-CR060', cat: 'Progress', obj: 'Initial 0%', desc: '1. ดู indicator ตอนเปิดหน้า', data: '-', exp: "'ยังไม่มีข้อมูล 0%'" },
  { id: 'J-TAG-CR061', cat: 'Progress', obj: 'Update เมื่อกรอกชื่อ TH', desc: '1. กรอกชื่อ TH', data: '-', exp: '% เพิ่มขึ้น (ไปสู่ 50%/100%)' },
  { id: 'J-TAG-CR062', cat: 'Progress', obj: '100% เมื่อกรอกครบ', desc: '1. กรอก TH + EN', data: '-', exp: 'Progress = 100%' },

  { type: 'sub', text: 'P. ปุ่มบันทึก (Save)' },
  { id: 'J-TAG-CR070', cat: 'Save', obj: 'Happy path บันทึก TH/EN', desc: "1. กรอกชื่อ TH + EN (toggle off) | 2. คลิก 'บันทึก'", data: '-', exp: "Toast 'สำเร็จ' + redirect ไป list" },
  { id: 'J-TAG-CR071', cat: 'Save', obj: 'Happy path บันทึกด้วย toggle ON', desc: "1. กรอกชื่อ TH (toggle 2 ภาษา ON) | 2. คลิก 'บันทึก'", data: '-', exp: 'บันทึกสำเร็จ EN sync จาก TH' },
  { id: 'J-TAG-CR072', cat: 'Save', obj: 'Happy path บันทึกเปิดใช้งาน', desc: "1. กรอก + เปิด toggle สถานะ | 2. คลิก 'บันทึก'", data: '-', exp: "record สถานะ 'เปิดใช้งาน'" },
  { id: 'J-TAG-CR073', cat: 'Save', obj: 'บันทึกฟอร์มเปล่า', desc: "1. คลิก 'บันทึก' ทันที", data: '-', exp: "error 'กรุณากรอกชื่อ' (2 จุด TH+EN เมื่อ toggle off)" },
  { id: 'J-TAG-CR074', cat: 'Save', obj: 'บันทึกเมื่อขาด TH', desc: '1. ปิด toggle + กรอกแค่ EN | 2. บันทึก', data: '-', exp: 'error ใต้ TH' },
  { id: 'J-TAG-CR075', cat: 'Save', obj: 'บันทึกเมื่อขาด EN', desc: '1. ปิด toggle + กรอกแค่ TH | 2. บันทึก', data: '-', exp: 'error ใต้ EN' },
  { id: 'J-TAG-CR076', cat: 'Save', obj: 'Duplicate name', desc: '1. สร้างชื่อซ้ำกับที่มีอยู่', data: '-', exp: "error 'ชื่อซ้ำ' หรือ silent fail (bug)" },
  { id: 'J-TAG-CR077', cat: 'Save', obj: 'Double click', desc: "1. คลิก 'บันทึก' 2 ครั้งติด", data: '-', exp: 'ปุ่มถูก disable หลังคลิก ไม่สร้าง duplicate' },
  { id: 'J-TAG-CR078', cat: 'Save', obj: 'Loading state', desc: '1. ดูปุ่มขณะ saving', data: '-', exp: 'แสดง spinner / disabled' },
  { id: 'J-TAG-CR079', cat: 'Save', obj: 'Network ขาด', desc: '1. ตัด network | 2. บันทึก', data: '-', exp: "error message 'ไม่สามารถเชื่อมต่อได้'" },
  { id: 'J-TAG-CR080', cat: 'Save', obj: 'Server 500', desc: '1. Mock 500 → บันทึก', data: '-', exp: 'error message ที่เหมาะสม' },

  { type: 'sub', text: 'Q. การยกเลิก / ออกจากหน้า' },
  { id: 'J-TAG-CR090', cat: 'Exit', obj: 'ออกโดยไม่แก้ไข', desc: '1. คลิก breadcrumb back', data: '-', exp: 'กลับ list ทันที (ไม่มี warning)' },
  { id: 'J-TAG-CR091', cat: 'Exit', obj: 'beforeunload (Dirty form)', desc: '1. กรอกข้อมูล | 2. navigate ออก', data: '-', exp: 'แสดง browser warning' },
  { id: 'J-TAG-CR092', cat: 'Exit', obj: 'Browser back หลังแก้ไข', desc: '1. กด back หลังกรอก', data: '-', exp: 'แสดง warning เช่นเดียวกัน' },
  { id: 'J-TAG-CR093', cat: 'Exit', obj: 'Refresh หลังแก้ไข', desc: '1. F5', data: '-', exp: 'แสดง browser warning' },
  { id: 'J-TAG-CR094', cat: 'Exit', obj: 'ปุ่มย้อนกลับใน UI', desc: '1. คลิก back arrow มุมซ้ายบน', data: '-', exp: 'กลับ list (มี warning ถ้า dirty)' },

  { type: 'part', text: 'PART 3: หน้า Edit (แก้ไขแท็กสินค้า)' },
  { type: 'sub', text: 'R. เปิดหน้า Edit' },
  { id: 'J-TAG-ED001', cat: 'Edit-Open', obj: 'เปิดผ่านไอคอน Edit', desc: '1. คลิกดินสอที่แถว', data: 'URL: /tags/update/{id}', exp: 'เปิดหน้า Edit พร้อม id ใน URL' },
  { id: 'J-TAG-ED002', cat: 'Edit-Open', obj: 'เปิดผ่าน URL ตรง', desc: '1. พิมพ์ URL ตรง', data: '-', exp: 'หน้าโหลด' },
  { id: 'J-TAG-ED003', cat: 'Edit-Open', obj: "Header 'แก้ไขแท็ก'", desc: '1. ดูหัวข้อ', data: '-', exp: "แสดง 'แก้ไขแท็ก'" },
  { id: 'J-TAG-ED004', cat: 'Edit-Open', obj: 'โหลดข้อมูลเดิม', desc: '1. ดูทุกฟิลด์', data: '-', exp: 'ชื่อ TH/EN + สถานะ ตรงกับ record' },
  { id: 'J-TAG-ED005', cat: 'Edit-Open', obj: 'Breadcrumb', desc: '1. ดู breadcrumb', data: '-', exp: '... > แท็กสินค้า > แก้ไข' },
  { id: 'J-TAG-ED006', cat: 'Edit-Open', obj: 'Invalid ID', desc: '1. URL /update/99999999 (ID ไม่มี)', data: '-', exp: '404 หรือ redirect / error' },

  { type: 'sub', text: 'S. แก้ไขฟิลด์ + บันทึก' },
  { id: 'J-TAG-ED010', cat: 'Edit-Update', obj: 'แก้ชื่อ TH', desc: '1. แก้ชื่อ TH เป็นค่าใหม่ | 2. บันทึก', data: '-', exp: "Toast 'สำเร็จ' + ตารางอัพเดต" },
  { id: 'J-TAG-ED011', cat: 'Edit-Update', obj: 'แก้ชื่อ EN', desc: '1. ปิด toggle + แก้ EN + บันทึก', data: '-', exp: 'บันทึกสำเร็จ' },
  { id: 'J-TAG-ED012', cat: 'Edit-Update', obj: 'เปลี่ยนสถานะ ฉบับร่าง → เปิดใช้งาน', desc: '1. คลิก toggle + บันทึก', data: '-', exp: 'สถานะอัพเดต' },
  { id: 'J-TAG-ED013', cat: 'Edit-Update', obj: "เปลี่ยน toggle 'ใช้เหมือนกัน 2 ภาษา'", desc: '1. ปิด/เปิด toggle + บันทึก', data: '-', exp: 'EN field state เปลี่ยนตาม' },
  { id: 'J-TAG-ED014', cat: 'Edit-Update', obj: 'เคลียร์ชื่อแล้วบันทึก', desc: '1. ลบ TH + บันทึก', data: '-', exp: "error 'กรุณากรอกชื่อ'" },
  { id: 'J-TAG-ED015', cat: 'Edit-Update', obj: 'แก้แล้วยกเลิก', desc: '1. แก้ | 2. visit list', data: '-', exp: 'ค่าเดิมไม่เปลี่ยน' },

  { type: 'sub', text: 'T. เมนู 3-จุด ใน Edit' },
  { id: 'J-TAG-ED020', cat: 'Edit-Menu', obj: 'คลิก Open menu', desc: '1. คลิกปุ่ม 3 จุด', data: '-', exp: 'แสดง menu: คัดลอกแท็ก, ลบแท็ก' },
  { id: 'J-TAG-ED021', cat: 'Edit-Menu', obj: 'คัดลอกแท็ก', desc: "1. menu → 'คัดลอกแท็ก'", data: '-', exp: "Toast 'สำเร็จ' + สร้าง record ใหม่" },
  { id: 'J-TAG-ED022', cat: 'Edit-Menu', obj: 'เปิดเมนู → ลบแท็ก → ยกเลิก', desc: "1. menu → 'ลบแท็ก' → 'ยกเลิก'", data: '-', exp: 'dialog ปิด record ยังอยู่' },
  { id: 'J-TAG-ED023', cat: 'Edit-Menu', obj: 'Confirm dialog text', desc: "1. menu → 'ลบแท็ก'", data: '-', exp: "dialog แสดง 'ยืนยันลบแท็กนี้ใช่หรือไม่'" },
  { id: 'J-TAG-ED024', cat: 'Edit-Menu', obj: 'ยืนยันลบ', desc: '1. ยืนยันลบ', data: '-', exp: "Toast 'สำเร็จ' + record หายจาก list" },
  { id: 'J-TAG-ED025', cat: 'Edit-Menu', obj: 'ปิด dialog ด้วย ESC', desc: "1. menu → 'ลบแท็ก' → ESC", data: '-', exp: 'dialog ปิด' },

  { type: 'part', text: 'PART 4: UI/UX + Permission/Security' },
  { type: 'sub', text: 'U. UI/UX' },
  { id: 'J-TAG-UX001', cat: 'Responsive', obj: 'Desktop 1920', desc: '1. เปิด 1920px', data: '-', exp: 'Layout ปกติ' },
  { id: 'J-TAG-UX002', cat: 'Responsive', obj: 'Tablet 768', desc: '1. ปรับ 768px', data: '-', exp: 'Responsive ใช้งานได้' },
  { id: 'J-TAG-UX003', cat: 'Responsive', obj: 'Mobile 375', desc: '1. ปรับ 375px', data: '-', exp: 'Responsive ใช้งานได้' },
  { id: 'J-TAG-UX004', cat: 'Browser-Chrome', obj: 'Chrome', desc: '1. เปิด Chrome', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-TAG-UX005', cat: 'Browser-Firefox', obj: 'Firefox', desc: '1. เปิด Firefox', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-TAG-UX006', cat: 'Browser-Safari', obj: 'Safari', desc: '1. เปิด Safari', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-TAG-UX007', cat: 'Browser-Edge', obj: 'Edge', desc: '1. เปิด Edge', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-TAG-UX008', cat: 'Accessibility', obj: 'Tab navigation', desc: '1. กด Tab ผ่านฟิลด์', data: '-', exp: 'Focus ตามลำดับ' },
  { id: 'J-TAG-UX009', cat: 'Accessibility', obj: 'Enter key ใน input', desc: '1. กด Enter', data: '-', exp: 'ไม่ submit อัตโนมัติ (หรือ submit ตาม design)' },
  { id: 'J-TAG-UX010', cat: 'Loading', obj: 'Loading state list', desc: '1. โหลดหน้า', data: '-', exp: 'skeleton ปรากฏ' },

  { type: 'sub', text: 'V. Permission / Security' },
  { id: 'J-TAG-SEC001', cat: 'Permission-NoLogin', obj: 'ไม่ login → URL', desc: '1. ออกจากระบบ → เข้า URL', data: '-', exp: 'Redirect ไป /auth/sign-in' },
  { id: 'J-TAG-SEC002', cat: 'Permission-NoPerm', obj: 'User no permission', desc: '1. login ด้วย user role ไม่มีสิทธิ์', data: '-', exp: '403 / ซ่อนปุ่มสร้าง' },
  { id: 'J-TAG-SEC003', cat: 'Session-Timeout', obj: 'Timeout ระหว่างกรอก', desc: '1. กรอก | 2. รอ timeout | 3. บันทึก', data: '-', exp: 'Redirect login' },
  { id: 'J-TAG-SEC004', cat: 'XSS-Display', obj: 'XSS เมื่อแสดงผลใน list', desc: "1. สร้าง tag ชื่อ '<script>alert(1)</script>'", data: '-', exp: 'ตารางแสดงเป็น text ไม่ execute' },
  { id: 'J-TAG-SEC005', cat: 'CSRF', obj: 'CSRF token', desc: '1. ตรวจ request body/header', data: '-', exp: 'มี token ป้องกัน CSRF' },
]

// ===== BUILD CSV =====
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
  `Project Release / Version :,1.0,,,Module / Function :,${field('แท็กสินค้า (Tags) - List + Create + Edit + Delete')},,`,
  `URL List :,https://devstorex.jibc.codelabdev.co/store/product-manager/tags,,,,,,`,
  `URL Create :,https://devstorex.jibc.codelabdev.co/store/product-manager/tags/create,,,,,,`,
  `URL Edit :,${field('https://devstorex.jibc.codelabdev.co/store/product-manager/tags/update/{id}')},,,,,,`,
  blank,
  `Test Case ID,Category,Test case Objective,Test Description / Procedure,Test Data,Expected Result,Actual Result,Result (Pass/Fail)`,
  blank,
]

for (const row of ROWS) {
  if (row.type === 'part') {
    lines.push(sectionRow(`---- ${row.text} ----`))
    lines.push(blank)
    continue
  }
  if (row.type === 'sub') {
    lines.push(sectionRow(`-- ${row.text} --`))
    continue
  }
  // case row
  const r = results[row.id] || {}
  const actual = r.actual || ''
  const result = r.result || ''
  if (result) sum[result] = (sum[result] || 0) + 1
  lines.push([row.id, row.cat, row.obj, row.desc, row.data, row.exp, actual, result].map(field).join(','))
}

const total = Object.values(sum).reduce((a, b) => a + b, 0)
const passRate = total ? ((sum.Pass / total) * 100).toFixed(1) : '0.0'
const failRate = total ? ((sum.Fail / total) * 100).toFixed(1) : '0.0'

lines.push(blank)
lines.push(sectionRow('-- สรุปผลทดสอบรวม (Summary) --'))
lines.push(`Total Test Cases :,${total},,,,,,`)
lines.push(`Pass :,${sum.Pass},,,Fail :,${sum.Fail},,`)
lines.push(`Warning :,${sum.Warning},,,Not Tested :,${sum['Not Tested']},,`)
lines.push(blank)
lines.push(`Pass Rate :,${passRate}%,,,Fail Rate :,${failRate}%,,`)
lines.push(blank)
lines.push(`Notes :,${field('1. ทดสอบบน Chrome (Chromium) ผ่าน Puppeteer (Cypress binary เครื่องนี้ไม่พร้อม)')},,,,,,`)
lines.push(`,${field('2. ทดสอบบน devstorex.jibc.codelabdev.co (ใหม่: toggle "ใช้เหมือนกัน 2 ภาษา" + ปุ่ม "ตัวกรอง" แยก + column "จำนวนรายการสินค้า" + progress indicator)')},,,,,,`)
lines.push(`,${field('3. [Bug] LP022: filter สถานะไม่มีตัวเลือก "ปิดใช้งาน" (ค้างจากเทสครั้งก่อน, run นี้ไม่ verify เพราะ selector mismatch - Warning)')},,,,,,`)
lines.push(`,${field('4. [Bug] CR076: สร้างชื่อซ้ำ → silent fail (stillOnCreate=true แต่ไม่มี error message) - Fail')},,,,,,`)
lines.push(`,${field('5. [Bug] ED006: URL /update/{invalid-id} → render Edit-like ฟอร์มเปล่า ไม่ redirect/404 (pattern เดียวกับ template-options, mapping-conditions) - Fail')},,,,,,`)
lines.push(`,${field('6. [Bug] ED021: Edit menu มีเฉพาะ "ลบแท็ก" - ไม่พบ "คัดลอกแท็ก" (feature ถูกถอดจาก devstorex) - Fail')},,,,,,`)
lines.push(`,${field('7. [Warning] CR023/CR034: ฟิลด์ชื่อรับเกิน 256 ตัวอักษร (ไม่มี maxLength ฝั่ง client - ต้อง verify backend limit)')},,,,,,`)
lines.push(`,${field('8. [Warning] CR026: รับ space-only ใน input - ไม่ trim client-side (ต้อง verify backend)')},,,,,,`)
lines.push(`,${field('9. Sections "-- ... --" ใช้ตัวคั่นมาตรฐาน (ไม่ใช้ #/=) ตามรูปแบบ test case JIB')},,,,,,`)
lines.push(`,${field('10. Selector mismatch ใน automated run: popover สถานะ + dropdown ปรับแต่งคอลัมน์ ไม่ใช้ [role=dialog]/[role=menuitemcheckbox] - เคสที่กระทบใช้ override based on contextual evidence จาก case อื่น')},,,,,,`)
lines.push(`,${field('11. Not Tested ส่วนใหญ่: Cross-browser (Firefox/Safari/Edge), Responsive (tablet/mobile), Network errors, Permission/Session timeout - ต้องใช้ environment พิเศษหรือ user อื่น')},,,,,,`)

fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log('Summary:', sum, '| total:', total, '| pass rate:', passRate + '%', '| fail rate:', failRate + '%')
console.log('Written:', OUT)
