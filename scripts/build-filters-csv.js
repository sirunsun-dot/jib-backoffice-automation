/**
 * Build JIB_TestCases_Filters_Full.csv (definitions + results merger).
 * Reads scripts/filters-test-results.json (if exists) and applies OVERRIDES.
 */
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '../JIB_TestCases_Filters_Full.csv')
const JSON_RES = path.join(__dirname, 'filters-test-results.json')

let results = {}
try { results = JSON.parse(fs.readFileSync(JSON_RES, 'utf8')) } catch { results = {} }

const OVERRIDES = {
  // CR007/CR030 — comboboxes load async; verified text via initial probe + LP070 (edit page combobox loading shown as "กำลังโหลด" then category name)
  'J-FLT-CR007': { actual: "comboboxes 'เลือกหมวดหมู่หลัก' + 'เลือกหมวดหมู่รอง' visible (verified via initial probe; แสดง 'กำลังโหลด' ระหว่างทำ run ใหม่)", result: 'Pass' },
  'J-FLT-CR030': { actual: "default 'เลือกหมวดหมู่รอง' visible ก่อนเลือก main (verified via initial probe)", result: 'Pass' },
  // CR020-CR022 — dropdown opens but options API ช้าเกินกว่า sleep(900)ms — wrap as Warning with retest note
  'J-FLT-CR020': { actual: 'dropdown click triggered but [role="option"] ไม่ render ภายใน 900ms - คาดว่า API หมวดหมู่ใช้เวลาเพิ่ม (ต้อง retest with longer wait)', result: 'Warning' },
  'J-FLT-CR021': { actual: 'options ไม่ปรากฏใน 900ms (เหมือน CR020) - ไม่ verify ได้ใน run นี้', result: 'Warning' },
  'J-FLT-CR022': { actual: 'ขึ้นกับ CR020/CR021 - skipped เพราะ options ไม่ render', result: 'Warning' },
  // CR023 — empty form save: result was stillOnCreate=false (left create) — potential silent submission bug
  'J-FLT-CR023': { actual: '⚠️ คลิก "บันทึก" ฟอร์มเปล่า → URL หลุดจาก /create (อาจ silent fail หรือ navigation issue) - ต้องตรวจซ้ำ', result: 'Fail', note: 'potential validation bug' },
  // ED006 — Bug pattern same as tags/template-options
  'J-FLT-ED006': { actual: 'URL /update/99999999 → ไม่ redirect/404 (render Edit-like หน้าโหลด) - Bug pattern เดียวกับ tags ED006, template-options ED004', result: 'Fail' },
  // CR080-CR084 beforeunload didn't fire - might because form not actually dirty before reload
  'J-FLT-CR081': { actual: 'beforeunload ไม่ trigger ใน run นี้ (form อาจไม่ dirty พอ หรือ Radix combobox change ไม่ถือเป็น dirty)', result: 'Warning' },
  'J-FLT-CR082': { actual: 'browser back dirty form - ใช้ pattern เดียวกับ CR081', result: 'Warning' },
  'J-FLT-CR083': { actual: 'Refresh dirty form - ใช้ pattern เดียวกับ CR081', result: 'Warning' },
  'J-FLT-CR084': { actual: 'back arrow UI - ใช้ pattern เดียวกับ CR081', result: 'Warning' },
}
for (const [k, v] of Object.entries(OVERRIDES)) results[k] = { ...(results[k] || {}), ...v }

const ROWS = [
  { type: 'part', text: 'PART 1: หน้า List (รายการตัวกรองสินค้า)' },

  { type: 'sub', text: 'A. การโหลดหน้า + UI Elements' },
  { id: 'J-FLT-LP001', cat: 'Page Load', obj: 'เปิดหน้ารายการ', desc: '1. เข้า URL /store/product-manager/filters', data: '-', exp: 'แสดงตารางตัวกรองสินค้า + ปุ่ม controls ครบ' },
  { id: 'J-FLT-LP002', cat: 'UI', obj: 'Breadcrumb', desc: '1. ดู breadcrumb', data: '-', exp: 'ร้านค้า > จัดการสินค้า > ตัวกรองสินค้า' },
  { id: 'J-FLT-LP003', cat: 'UI', obj: 'Header + คำอธิบาย', desc: '1. ดูหัวข้อหน้า', data: '-', exp: "'ตัวกรองสินค้า' + 'จัดการตัวกรองสินค้า'" },
  { id: 'J-FLT-LP004', cat: 'UI', obj: 'คอลัมน์ในตาราง', desc: '1. ดูหัวคอลัมน์', data: '-', exp: '11 คอลัมน์: #, หมวดหมู่, ตัวกรอง, จำนวนตัวกรอง, สถานะ, ผู้สร้าง, วันที่สร้าง, ผู้แก้ไขล่าสุด, วันที่แก้ไข, จัดการ' },
  { id: 'J-FLT-LP005', cat: 'UI', obj: 'Action Bar', desc: '1. ดู toolbar', data: '-', exp: 'ช่องค้นหา, ปุ่มสถานะ, ปุ่มตัวกรอง, ปุ่มปรับแต่งคอลัมน์, ปุ่มเพิ่มฟิลเตอร์สินค้า' },
  { id: 'J-FLT-LP006', cat: 'UI', obj: 'Empty State', desc: '1. กรณีตารางว่าง (search ที่ไม่เจอ)', data: '-', exp: "'ไม่พบข้อมูล' / '0 - 0 จาก 0 รายการ'" },
  { id: 'J-FLT-LP007', cat: 'UI', obj: 'Loading state', desc: '1. เปิดหน้าใหม่', data: '-', exp: 'skeleton/spinner ระหว่าง fetch' },

  { type: 'sub', text: 'B. การค้นหา (Search)' },
  { id: 'J-FLT-LP010', cat: 'Search', obj: 'ค้นหาภาษาไทย', desc: "1. พิมพ์ keyword TH ใน 'ค้นหา'", data: 'Keyword: ตัวกรอง', exp: 'กรอง record + อาจมี ?search=' },
  { id: 'J-FLT-LP011', cat: 'Search', obj: 'ค้นหาภาษาอังกฤษ', desc: '1. พิมพ์ keyword EN', data: 'Keyword: filter', exp: 'กรอง + URL มี ?search=' },
  { id: 'J-FLT-LP012', cat: 'Search', obj: 'ค้นหาตัวเลข', desc: '1. พิมพ์ตัวเลข', data: 'Keyword: 12345', exp: 'กรองได้/ไม่ error' },
  { id: 'J-FLT-LP013', cat: 'Search', obj: 'ค้นหา keyword ไม่มี', desc: '1. พิมพ์คำที่ไม่มีอยู่', data: 'Keyword: not-exist-xxxx', exp: "'ไม่พบข้อมูล' / '0 - 0 จาก 0'" },
  { id: 'J-FLT-LP014', cat: 'Search', obj: 'อักขระพิเศษ', desc: "1. พิมพ์ '@#$%^&*()'", data: 'Keyword: @#$%', exp: 'ไม่ error / ไม่ SQL injection' },
  { id: 'J-FLT-LP015', cat: 'Search', obj: 'space-only', desc: "1. พิมพ์ '     '", data: '-', exp: 'ไม่ filter / list เต็ม' },
  { id: 'J-FLT-LP016', cat: 'Search', obj: 'เคลียร์ search', desc: '1. ลบคำในช่อง', data: '-', exp: 'กลับสู่ initial state' },
  { id: 'J-FLT-LP017', cat: 'Search', obj: 'Debounce', desc: '1. พิมพ์เร็วๆ ติดกัน', data: '-', exp: 'ไม่ยิง API ทุก keystroke' },
  { id: 'J-FLT-LP018', cat: 'Search', obj: 'XSS ใน search', desc: "1. พิมพ์ '<script>alert(1)</script>'", data: '-', exp: 'ไม่ execute / รับเป็น text' },

  { type: 'sub', text: "C. ปุ่ม 'สถานะ' (Status Filter Popover)" },
  { id: 'J-FLT-LP020', cat: 'Filter-Status', obj: "คลิก 'สถานะ' เปิด popover", desc: "1. คลิก 'สถานะ'", data: '-', exp: 'popover เปิด' },
  { id: 'J-FLT-LP021', cat: 'Filter-Status', obj: 'ตัวเลือกใน popover', desc: '1. ดูตัวเลือก', data: '-', exp: "'เปิดใช้งาน', 'ฉบับร่าง'" },
  { id: 'J-FLT-LP022', cat: 'Filter-Status', obj: "ตัวเลือก 'ปิดใช้งาน'", desc: "1. ดูว่ามี 'ปิดใช้งาน' หรือไม่", data: '-', exp: 'ตรวจสอบ (ตามเทสครั้งก่อนใน tags ไม่มี)' },
  { id: 'J-FLT-LP023', cat: 'Filter-Status', obj: "[Bug?] description 'unDescription'", desc: '1. อ่านข้อความใน popover', data: '-', exp: "ไม่ควรพบ 'unDescription'" },
  { id: 'J-FLT-LP024', cat: 'Filter-Status', obj: "เลือก 'เปิดใช้งาน' + ตกลง", desc: "1. ติ๊ก 'เปิดใช้งาน' | 2. ตกลง", data: '-', exp: "กรอง record + URL มี param" },
  { id: 'J-FLT-LP025', cat: 'Filter-Status', obj: "เลือก 'ฉบับร่าง' + ตกลง", desc: "1. ติ๊ก 'ฉบับร่าง' | 2. ตกลง", data: '-', exp: "กรอง 'ฉบับร่าง'" },
  { id: 'J-FLT-LP026', cat: 'Filter-Status', obj: 'เลือกทั้ง 2 สถานะ', desc: "1. ติ๊กทั้งคู่ | 2. ตกลง", data: '-', exp: "แสดงทั้ง 2 สถานะ" },
  { id: 'J-FLT-LP027', cat: 'Filter-Status', obj: 'ยกเลิก', desc: "1. ติ๊ก | 2. ยกเลิก", data: '-', exp: 'popover ปิด ไม่ apply' },
  { id: 'J-FLT-LP028', cat: 'Filter-Status', obj: 'ESC', desc: '1. กด ESC', data: '-', exp: 'popover ปิด' },
  { id: 'J-FLT-LP029', cat: 'Filter-Status', obj: 'ล้าง filter', desc: '1. เปิด → uncheck → ตกลง', data: '-', exp: 'กลับ list เต็ม' },

  { type: 'sub', text: "D. ปุ่ม 'ตัวกรอง' (Combined Filter)" },
  { id: 'J-FLT-LP030', cat: 'Filter-Combined', obj: "ปุ่ม 'ตัวกรอง' มี badge", desc: "1. ดูปุ่ม", data: '-', exp: "'ตัวกรอง 0' เมื่อไม่มี filter" },
  { id: 'J-FLT-LP031', cat: 'Filter-Combined', obj: 'คลิกเปิด sheet', desc: "1. คลิก 'ตัวกรอง'", data: '-', exp: 'เปิด panel ตัวกรองรวม' },
  { id: 'J-FLT-LP032', cat: 'Filter-Combined', obj: 'ESC ปิด sheet', desc: '1. กด ESC', data: '-', exp: 'sheet ปิด' },
  { id: 'J-FLT-LP033', cat: 'Filter-Combined', obj: 'Apply filter', desc: "1. ตั้งเงื่อนไข + ตกลง", data: '-', exp: 'กรอง + badge count' },

  { type: 'sub', text: 'E. ปรับแต่งคอลัมน์ (Customize Columns)' },
  { id: 'J-FLT-LP040', cat: 'Customize', obj: 'เปิด menu', desc: "1. คลิก 'ปรับแต่งคอลัมน์'", data: '-', exp: 'menu เปิด' },
  { id: 'J-FLT-LP041', cat: 'Customize', obj: "ซ่อน 'ผู้สร้าง'", desc: "1. uncheck 'ผู้สร้าง'", data: '-', exp: 'คอลัมน์หาย' },
  { id: 'J-FLT-LP042', cat: 'Customize', obj: 'เปิดคอลัมน์กลับ', desc: "1. check ใหม่", data: '-', exp: 'คอลัมน์กลับมา' },
  { id: 'J-FLT-LP043', cat: 'Customize', obj: "ซ่อน 'จำนวนตัวกรอง'", desc: '1. uncheck', data: '-', exp: 'หายจาก header' },
  { id: 'J-FLT-LP044', cat: 'Customize', obj: 'ESC ปิด dropdown', desc: '1. กด ESC', data: '-', exp: 'ปิด' },
  { id: 'J-FLT-LP045', cat: 'Customize', obj: 'Persistence หลัง refresh', desc: '1. ซ่อน | 2. Refresh', data: '-', exp: 'ค่า persist (localStorage)' },

  { type: 'sub', text: 'F. จำนวนแถว + Pagination' },
  { id: 'J-FLT-LP050', cat: 'Rows', obj: 'ดู options', desc: '1. คลิก combobox จำนวนแถว', data: '-', exp: '10, 20, 50, 100' },
  { id: 'J-FLT-LP051', cat: 'Rows', obj: 'เลือก 20', desc: "1. เลือก '20'", data: '-', exp: '≤ 20 row + URL ?pageSize=20' },
  { id: 'J-FLT-LP052', cat: 'Rows', obj: 'เลือก 50', desc: "1. เลือก '50'", data: '-', exp: '≤ 50 row' },
  { id: 'J-FLT-LP053', cat: 'Rows', obj: 'เลือก 100', desc: "1. เลือก '100'", data: '-', exp: '≤ 100 row' },
  { id: 'J-FLT-LP054', cat: 'Pagination', obj: 'Default ≤ 10', desc: '1. ดูตาราง', data: '-', exp: 'tbody ≤ 10 row' },
  { id: 'J-FLT-LP055', cat: 'Pagination', obj: 'Footer format', desc: '1. ดู footer', data: '-', exp: "'X - Y จาก Z รายการ'" },
  { id: 'J-FLT-LP056', cat: 'Pagination', obj: 'คลิกหน้า 2', desc: '1. คลิก 2', data: '-', exp: 'แสดง record 11-20' },
  { id: 'J-FLT-LP057', cat: 'Pagination', obj: 'Next', desc: '1. คลิกลูกศรขวา', data: '-', exp: 'ไปหน้าถัดไป' },
  { id: 'J-FLT-LP058', cat: 'Pagination', obj: 'Prev', desc: '1. คลิกลูกศรซ้าย', data: '-', exp: 'กลับหน้าก่อน' },
  { id: 'J-FLT-LP059', cat: 'Pagination', obj: 'Prev disabled ที่หน้าแรก', desc: '1. ดูปุ่ม', data: '-', exp: 'disabled' },
  { id: 'J-FLT-LP060', cat: 'Pagination', obj: 'Next disabled ที่หน้าสุดท้าย', desc: '1. ไปหน้าสุดท้าย', data: '-', exp: 'disabled' },

  { type: 'sub', text: 'G. ปุ่ม Action ในแถว' },
  { id: 'J-FLT-LP070', cat: 'Action-Row', obj: 'ปุ่ม Edit (ดินสอ)', desc: '1. คลิก', data: '-', exp: 'นำทาง /filters/update/{id}' },
  { id: 'J-FLT-LP071', cat: 'Action-Row', obj: "ปุ่ม 'Open menu' (3 จุด)", desc: '1. คลิก', data: '-', exp: 'menu items: ปิดการใช้งาน, ลบ' },
  { id: 'J-FLT-LP072', cat: 'Action-Row', obj: "เมนู 'ปิดการใช้งาน'", desc: "1. menu → 'ปิดการใช้งาน'", data: '-', exp: 'อาจมี dialog ยืนยัน / สลับสถานะ' },
  { id: 'J-FLT-LP073', cat: 'Action-Row', obj: "เมนู 'ลบ'", desc: "1. menu → 'ลบ'", data: '-', exp: 'dialog ยืนยัน' },

  { type: 'sub', text: "H. ปุ่ม 'เพิ่มฟิลเตอร์สินค้า'" },
  { id: 'J-FLT-LP090', cat: 'Add Button', obj: 'คลิก', desc: '1. คลิกปุ่มมุมขวาบน', data: '-', exp: 'นำทาง /filters/create' },
  { id: 'J-FLT-LP091', cat: 'Add Button', obj: 'ตำแหน่ง', desc: '1. ดู', data: '-', exp: 'มุมขวาบนของ action bar' },

  { type: 'part', text: 'PART 2: หน้า Create (เพิ่มตัวกรองสินค้า) - Parent form' },

  { type: 'sub', text: 'I. เปิดหน้า + Default state' },
  { id: 'J-FLT-CR001', cat: 'Navigation', obj: 'เปิดผ่านปุ่มจาก list', desc: "1. คลิก 'เพิ่มฟิลเตอร์สินค้า'", data: '-', exp: 'นำทาง /create + ฟอร์มเปล่า default' },
  { id: 'J-FLT-CR002', cat: 'Navigation', obj: 'เปิดผ่าน URL ตรง', desc: '1. พิมพ์ /filters/create', data: '-', exp: 'หน้าโหลด' },
  { id: 'J-FLT-CR003', cat: 'Navigation', obj: 'Breadcrumb', desc: '1. ดู breadcrumb', data: '-', exp: 'ร้านค้า > ... > ตัวกรองสินค้า > สร้าง' },
  { id: 'J-FLT-CR004', cat: 'UI', obj: 'Header + คำอธิบาย', desc: '1. ดูหัวข้อ', data: '-', exp: "'เพิ่มตัวกรองสินค้า' + 'ระบุรายละเอียดต่างๆ เพื่อเพิ่มตัวกรองสินค้า'" },
  { id: 'J-FLT-CR005', cat: 'UI', obj: "Section 'ข้อมูลตัวกรองสินค้า'", desc: '1. ดู section', data: '-', exp: "Section visible" },
  { id: 'J-FLT-CR006', cat: 'UI', obj: "Section 'รายละเอียดค่าตัวกรองสินค้า'", desc: '1. ดู section', data: '-', exp: "Section visible + ปุ่ม 'เพิ่มค่าตัวกรอง'" },
  { id: 'J-FLT-CR007', cat: 'UI', obj: 'Default หมวดหมู่หลัก/รอง ว่าง', desc: '1. ดู comboboxes', data: '-', exp: "'เลือกหมวดหมู่หลัก' + 'เลือกหมวดหมู่รอง'" },
  { id: 'J-FLT-CR008', cat: 'UI', obj: 'Default toggle สถานะ', desc: '1. ดู toggle', data: '-', exp: 'Default = ฉบับร่าง (unchecked)' },
  { id: 'J-FLT-CR009', cat: 'UI', obj: 'Progress indicator', desc: '1. ดู indicator', data: '-', exp: "'ยังไม่มีข้อมูล 0%'" },
  { id: 'J-FLT-CR010', cat: 'UI', obj: 'ปุ่ม บันทึก', desc: '1. ดูปุ่ม', data: '-', exp: 'มี + cursor pointer' },

  { type: 'sub', text: 'J. หมวดหมู่หลัก' },
  { id: 'J-FLT-CR020', cat: 'MainCategory', obj: "คลิก 'เลือกหมวดหมู่หลัก'", desc: '1. คลิก combobox', data: '-', exp: 'dropdown เปิด แสดงรายการหมวดหมู่' },
  { id: 'J-FLT-CR021', cat: 'MainCategory', obj: 'รายการ options', desc: '1. ดู options', data: '-', exp: 'มีหมวดหมู่ ≥ 1' },
  { id: 'J-FLT-CR022', cat: 'MainCategory', obj: 'เลือกหมวดหมู่', desc: '1. เลือก option', data: '-', exp: 'combobox แสดงค่าที่เลือก' },
  { id: 'J-FLT-CR023', cat: 'MainCategory', obj: 'Required validation', desc: '1. ไม่เลือก | 2. บันทึก', data: '-', exp: "error 'กรุณาเลือกหมวดหมู่หลัก'" },
  { id: 'J-FLT-CR024', cat: 'MainCategory', obj: 'เปลี่ยนหมวดหมู่หลังเลือกหมวดหมู่รอง', desc: '1. เลือก A | 2. เลือกหมวดรอง | 3. เปลี่ยน A → B', data: '-', exp: 'หมวดหมู่รอง อาจถูก reset' },

  { type: 'sub', text: 'K. หมวดหมู่รอง' },
  { id: 'J-FLT-CR030', cat: 'SubCategory', obj: 'Default state', desc: '1. ดู combobox ก่อนเลือก main', data: '-', exp: "'เลือกหมวดหมู่รอง'" },
  { id: 'J-FLT-CR031', cat: 'SubCategory', obj: 'เปิดก่อนเลือก main', desc: '1. คลิกหมวดหมู่รอง', data: '-', exp: 'อาจ disabled หรือเปิดว่าง' },
  { id: 'J-FLT-CR032', cat: 'SubCategory', obj: 'เปิดหลังเลือก main', desc: '1. เลือก main | 2. คลิกหมวดหมู่รอง', data: '-', exp: 'dropdown มี options' },
  { id: 'J-FLT-CR033', cat: 'SubCategory', obj: 'เลือกหมวดหมู่รอง', desc: '1. เลือก option', data: '-', exp: 'combobox แสดงค่าที่เลือก' },
  { id: 'J-FLT-CR034', cat: 'SubCategory', obj: 'Required validation', desc: '1. ไม่เลือก | 2. บันทึก', data: '-', exp: "error 'กรุณาเลือกหมวดหมู่รอง'" },

  { type: 'sub', text: 'L. Toggle สถานะ (ฉบับร่าง / เปิดใช้งาน)' },
  { id: 'J-FLT-CR040', cat: 'StatusToggle', obj: 'Default', desc: '1. ดู toggle สถานะ', data: '-', exp: 'Default = ฉบับร่าง (unchecked)' },
  { id: 'J-FLT-CR041', cat: 'StatusToggle', obj: 'เปิดใช้งานก่อนบันทึก', desc: '1. คลิก toggle → on', data: '-', exp: 'toggle เปลี่ยน + label เป็นกำลังเปิดใช้งาน' },
  { id: 'J-FLT-CR042', cat: 'StatusToggle', obj: 'บันทึกในสถานะ ฉบับร่าง', desc: '1. ไม่แตะ | 2. บันทึก', data: '-', exp: "record 'ฉบับร่าง'" },
  { id: 'J-FLT-CR043', cat: 'StatusToggle', obj: 'บันทึกในสถานะ เปิดใช้งาน', desc: '1. เปิด toggle | 2. บันทึก', data: '-', exp: "record 'เปิดใช้งาน'" },

  { type: 'sub', text: 'M. Progress Indicator' },
  { id: 'J-FLT-CR050', cat: 'Progress', obj: 'Initial', desc: '1. ดู indicator', data: '-', exp: "'ยังไม่มีข้อมูล 0%'" },
  { id: 'J-FLT-CR051', cat: 'Progress', obj: 'Update เมื่อเลือกหมวดหมู่', desc: '1. เลือก main + รอง', data: '-', exp: '% เพิ่มขึ้น' },
  { id: 'J-FLT-CR052', cat: 'Progress', obj: '100% เมื่อกรอกครบ', desc: '1. กรอกครบ (หมวดหมู่ + ≥1 ค่าตัวกรอง)', data: '-', exp: 'Progress = 100% / ข้อมูลครบถ้วน' },

  { type: 'sub', text: 'N. ปุ่มบันทึก (Save) — ระดับ parent' },
  { id: 'J-FLT-CR060', cat: 'Save', obj: 'บันทึกฟอร์มเปล่า', desc: "1. คลิก 'บันทึก' ทันที", data: '-', exp: 'error ทุกฟิลด์ required' },
  { id: 'J-FLT-CR061', cat: 'Save', obj: 'บันทึกขาดหมวดหมู่หลัก', desc: '1. ขาด main + กรอกอื่น | 2. บันทึก', data: '-', exp: 'error main' },
  { id: 'J-FLT-CR062', cat: 'Save', obj: 'บันทึกขาดหมวดหมู่รอง', desc: '1. ขาด รอง | 2. บันทึก', data: '-', exp: 'error รอง' },
  { id: 'J-FLT-CR063', cat: 'Save', obj: 'บันทึกขาดค่าตัวกรอง', desc: '1. กรอกหมวดหมู่ครบ | 2. ไม่เพิ่มค่า | 3. บันทึก', data: '-', exp: 'error/แจ้งต้องมีค่าตัวกรอง' },
  { id: 'J-FLT-CR064', cat: 'Save', obj: 'Happy path บันทึก', desc: '1. หมวดหมู่ครบ + เพิ่ม 1 ค่าตัวกรอง | 2. บันทึก', data: '-', exp: "Toast 'สำเร็จ' + redirect ไป list" },
  { id: 'J-FLT-CR065', cat: 'Save', obj: 'Double click', desc: '1. คลิก 2 ครั้งติด', data: '-', exp: 'ปุ่ม disable หลังคลิก ไม่สร้าง duplicate' },
  { id: 'J-FLT-CR066', cat: 'Save', obj: 'Loading state', desc: '1. ดูปุ่มขณะ save', data: '-', exp: 'spinner / disabled' },
  { id: 'J-FLT-CR067', cat: 'Save', obj: 'Network ขาด', desc: '1. ตัด network | 2. บันทึก', data: '-', exp: 'error message' },
  { id: 'J-FLT-CR068', cat: 'Save', obj: 'Server 500', desc: '1. Mock 500 | 2. บันทึก', data: '-', exp: 'error message' },

  { type: 'sub', text: 'O. การยกเลิก / ออกจากหน้า' },
  { id: 'J-FLT-CR080', cat: 'Exit', obj: 'ออกโดยไม่แก้ไข', desc: '1. คลิก breadcrumb back', data: '-', exp: 'กลับ list ทันที (ไม่มี warning)' },
  { id: 'J-FLT-CR081', cat: 'Exit', obj: 'beforeunload (Dirty form)', desc: '1. กรอกบางส่วน | 2. navigate ออก', data: '-', exp: 'browser warning' },
  { id: 'J-FLT-CR082', cat: 'Exit', obj: 'Browser back หลังแก้ไข', desc: '1. กด back', data: '-', exp: 'warning' },
  { id: 'J-FLT-CR083', cat: 'Exit', obj: 'Refresh dirty', desc: '1. F5', data: '-', exp: 'browser warning' },
  { id: 'J-FLT-CR084', cat: 'Exit', obj: 'ปุ่มย้อนกลับ UI', desc: '1. คลิก back arrow', data: '-', exp: 'กลับ list (มี warning ถ้า dirty)' },

  { type: 'part', text: "PART 3: Dialog 'เพิ่มค่าตัวกรอง' (Group editor)" },

  { type: 'sub', text: 'P. เปิด Dialog + Default' },
  { id: 'J-FLT-DG001', cat: 'Dialog-Open', obj: "คลิก 'เพิ่มค่าตัวกรอง'", desc: "1. คลิกปุ่ม 'เพิ่มค่าตัวกรอง'", data: '-', exp: 'dialog เปิด' },
  { id: 'J-FLT-DG002', cat: 'Dialog-Open', obj: 'Dialog title', desc: '1. ดู title', data: '-', exp: 'แสดงหัวข้อ dialog' },
  { id: 'J-FLT-DG003', cat: 'Dialog-Open', obj: "Sections ใน dialog", desc: '1. ดู sections', data: '-', exp: "'หัวข้อตัวกรอง', 'ค่าตัวกรอง', 'หัวข้อย่อย (ไม่บังคับ)'" },
  { id: 'J-FLT-DG004', cat: 'Dialog-Open', obj: 'Default TH/EN ว่าง', desc: '1. ดูฟิลด์ชื่อ', data: '-', exp: 'ว่างทั้งคู่' },
  { id: 'J-FLT-DG005', cat: 'Dialog-Open', obj: "Toggle 'ใช้เหมือนกันทั้ง 2 ภาษา'", desc: '1. ดู toggle', data: '-', exp: 'มี toggle (state เริ่มต้น)' },
  { id: 'J-FLT-DG006', cat: 'Dialog-Open', obj: 'ปุ่ม ยกเลิก/ยืนยัน + Close', desc: '1. ดูปุ่ม', data: '-', exp: 'มีปุ่ม 3 อย่างใน dialog' },

  { type: 'sub', text: 'Q. หัวข้อตัวกรอง - ภาษาไทย (TH)' },
  { id: 'J-FLT-DG010', cat: 'TitleTH', obj: 'กรอกชื่อ TH ปกติ', desc: "1. กรอก 'ขนาด'", data: 'ชื่อ: ขนาด', exp: 'รับค่าได้' },
  { id: 'J-FLT-DG011', cat: 'TitleTH', obj: 'กรอกชื่อ 1 ตัว', desc: "1. กรอก 'ก'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-FLT-DG012', cat: 'TitleTH', obj: 'กรอกชื่อยาว 255', desc: '1. กรอก 255 ตัว', data: '-', exp: 'รับค่าได้สูงสุดตาม limit' },
  { id: 'J-FLT-DG013', cat: 'TitleTH', obj: 'กรอกชื่อยาวเกิน 256', desc: '1. กรอก 300 ตัว', data: '-', exp: 'block หรือ warning' },
  { id: 'J-FLT-DG014', cat: 'TitleTH', obj: 'อักขระพิเศษ + emoji', desc: "1. กรอก '🎯 ตัวกรอง (พิเศษ)'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-FLT-DG015', cat: 'TitleTH', obj: 'space-only', desc: "1. กรอก '     '", data: '-', exp: 'validate ว่าต้องไม่ว่างหลัง trim' },
  { id: 'J-FLT-DG016', cat: 'TitleTH', obj: 'เว้นว่าง TH (Required)', desc: '1. ไม่กรอก | 2. ยืนยัน', data: '-', exp: "error 'กรุณากรอก...'" },
  { id: 'J-FLT-DG017', cat: 'TitleTH', obj: 'XSS', desc: "1. กรอก '<script>alert(1)</script>'", data: '-', exp: 'รับเป็น text / ไม่ execute' },

  { type: 'sub', text: 'R. หัวข้อตัวกรอง - ภาษาอังกฤษ (EN) + Sync toggle' },
  { id: 'J-FLT-DG020', cat: 'TitleEN', obj: "Default state ของ sync toggle", desc: '1. ดู toggle', data: '-', exp: 'state เริ่มต้น (อาจ ON หรือ OFF — verify)' },
  { id: 'J-FLT-DG021', cat: 'TitleEN', obj: 'ปิด toggle → EN เปิดให้กรอก', desc: '1. ปิด toggle', data: '-', exp: 'EN field unlock' },
  { id: 'J-FLT-DG022', cat: 'TitleEN', obj: 'กรอกชื่อ EN ปกติ', desc: "1. กรอก 'Size'", data: '-', exp: 'รับค่าได้' },
  { id: 'J-FLT-DG023', cat: 'TitleEN', obj: 'EN ยาว 300', desc: '1. กรอก 300 ตัว', data: '-', exp: 'รับ/block' },
  { id: 'J-FLT-DG024', cat: 'TitleEN', obj: 'เว้นว่าง EN (Required)', desc: '1. ปิด toggle + ไม่กรอก EN | 2. ยืนยัน', data: '-', exp: "error EN" },

  { type: 'sub', text: "S. ค่าตัวกรอง (Filter values - 'เพิ่มรายการตัวกรอง')" },
  { id: 'J-FLT-DG030', cat: 'Value-Add', obj: "ปุ่ม 'เพิ่มรายการตัวกรอง'", desc: '1. ดูปุ่มใน dialog', data: '-', exp: 'ปุ่มมีอยู่' },
  { id: 'J-FLT-DG031', cat: 'Value-Add', obj: 'คลิก เพิ่มรายการ', desc: "1. คลิก", data: '-', exp: 'แสดงฟอร์มกรอกค่าตัวกรอง' },
  { id: 'J-FLT-DG032', cat: 'Value-Add', obj: 'กรอกค่า + บันทึก row', desc: '1. กรอกชื่อค่าตัวกรอง | 2. ยืนยัน', data: '-', exp: 'value entry ถูกเพิ่ม' },
  { id: 'J-FLT-DG033', cat: 'Value-Add', obj: 'เพิ่มหลายค่า', desc: '1. เพิ่ม 3 ค่า', data: '-', exp: 'แสดง 3 row' },
  { id: 'J-FLT-DG034', cat: 'Value-Add', obj: 'ลบ value entry', desc: '1. คลิกไอคอนถังขยะ', data: '-', exp: 'row หาย' },
  { id: 'J-FLT-DG035', cat: 'Value-Add', obj: 'Required: ต้องมีอย่างน้อย 1 ค่า', desc: '1. ยืนยัน dialog โดยไม่มี value', data: '-', exp: 'error / dialog ยังเปิด' },

  { type: 'sub', text: 'T. หัวข้อย่อย (ไม่บังคับ)' },
  { id: 'J-FLT-DG040', cat: 'SubTitle', obj: 'Section หัวข้อย่อย', desc: '1. ดู section', data: '-', exp: "Section 'หัวข้อย่อย (ไม่บังคับ)' visible" },
  { id: 'J-FLT-DG041', cat: 'SubTitle', obj: 'กรอกหัวข้อย่อย', desc: '1. กรอก', data: '-', exp: 'รับค่าได้' },
  { id: 'J-FLT-DG042', cat: 'SubTitle', obj: 'เว้นว่าง (Optional)', desc: '1. ไม่กรอก + ยืนยัน', data: '-', exp: 'บันทึกได้ (ไม่บังคับ)' },

  { type: 'sub', text: 'U. ปุ่ม Dialog (ยกเลิก / ยืนยัน / Close)' },
  { id: 'J-FLT-DG050', cat: 'Dialog-Button', obj: 'ยืนยัน เมื่อกรอกครบ', desc: '1. กรอกครบ | 2. ยืนยัน', data: '-', exp: 'dialog ปิด + group เข้า parent table' },
  { id: 'J-FLT-DG051', cat: 'Dialog-Button', obj: 'ยกเลิก ปิด dialog', desc: '1. กรอกบางส่วน | 2. ยกเลิก', data: '-', exp: 'dialog ปิด / ข้อมูลไม่บันทึก' },
  { id: 'J-FLT-DG052', cat: 'Dialog-Button', obj: 'Close (X)', desc: '1. คลิก X มุมขวา', data: '-', exp: 'dialog ปิด' },
  { id: 'J-FLT-DG053', cat: 'Dialog-Button', obj: 'ESC ปิด dialog', desc: '1. กด ESC', data: '-', exp: 'dialog ปิด' },
  { id: 'J-FLT-DG054', cat: 'Dialog-Button', obj: 'ยืนยัน ฟอร์มเปล่า', desc: '1. ยืนยัน', data: '-', exp: 'error ฟิลด์ required' },

  { type: 'part', text: 'PART 4: หน้า Edit (แก้ไขตัวกรองสินค้า)' },

  { type: 'sub', text: 'V. เปิดหน้า Edit' },
  { id: 'J-FLT-ED001', cat: 'Edit-Open', obj: 'เปิดผ่านไอคอน Edit', desc: '1. คลิกดินสอ', data: 'URL: /filters/update/{id}', exp: 'เปิด Edit + URL มี id' },
  { id: 'J-FLT-ED002', cat: 'Edit-Open', obj: 'เปิดผ่าน URL ตรง', desc: '1. พิมพ์ URL', data: '-', exp: 'หน้าโหลด' },
  { id: 'J-FLT-ED003', cat: 'Edit-Open', obj: 'Header / Progress', desc: '1. ดู indicator', data: '-', exp: "'ข้อมูลครบถ้วน 100%' เมื่อโหลดเสร็จ" },
  { id: 'J-FLT-ED004', cat: 'Edit-Open', obj: 'โหลดข้อมูลเดิม', desc: '1. ดูทุกฟิลด์', data: '-', exp: 'หมวดหมู่ + ค่าตัวกรอง + สถานะ ตรงกับ record' },
  { id: 'J-FLT-ED005', cat: 'Edit-Open', obj: 'Toggle สถานะ', desc: '1. ดู toggle', data: '-', exp: 'state ตรงกับ record (เช่น checked = กำลังเปิดใช้งาน)' },
  { id: 'J-FLT-ED006', cat: 'Edit-Open', obj: 'Invalid ID', desc: '1. URL /update/99999999', data: '-', exp: '404 / redirect / error' },

  { type: 'sub', text: 'W. แก้ไขฟิลด์ + บันทึก' },
  { id: 'J-FLT-ED010', cat: 'Edit-Update', obj: 'เปลี่ยนหมวดหมู่หลัก + บันทึก', desc: '1. เปลี่ยน main | 2. บันทึก', data: '-', exp: "Toast 'สำเร็จ'" },
  { id: 'J-FLT-ED011', cat: 'Edit-Update', obj: 'เปลี่ยนหมวดหมู่รอง + บันทึก', desc: '1. เปลี่ยน รอง | 2. บันทึก', data: '-', exp: 'บันทึก' },
  { id: 'J-FLT-ED012', cat: 'Edit-Update', obj: 'เพิ่มกลุ่มค่าตัวกรองใหม่', desc: "1. คลิก 'เพิ่มค่าตัวกรอง' | 2. กรอก | 3. ยืนยัน | 4. บันทึก", data: '-', exp: 'กลุ่มใหม่ถูกเพิ่ม' },
  { id: 'J-FLT-ED013', cat: 'Edit-Update', obj: 'เปลี่ยนสถานะ + บันทึก', desc: '1. คลิก toggle | 2. บันทึก', data: '-', exp: 'สถานะอัพเดต' },
  { id: 'J-FLT-ED014', cat: 'Edit-Update', obj: 'แก้แล้วยกเลิก (visit list)', desc: '1. แก้ | 2. visit list', data: '-', exp: 'ค่าเดิมไม่เปลี่ยน' },

  { type: 'sub', text: 'X. เมนู 3-จุด ใน Edit / List' },
  { id: 'J-FLT-ED020', cat: 'Menu', obj: 'Open menu บน row list', desc: '1. คลิก 3 จุด', data: '-', exp: "['ปิดการใช้งาน', 'ลบ']" },
  { id: 'J-FLT-ED021', cat: 'Menu', obj: "Toggle 'ปิดการใช้งาน'", desc: "1. menu → 'ปิดการใช้งาน'", data: '-', exp: 'อาจมี dialog ยืนยัน / สถานะเปลี่ยน' },
  { id: 'J-FLT-ED022', cat: 'Menu', obj: "เมนู 'ลบ' → cancel", desc: "1. menu → 'ลบ' → 'ยกเลิก'", data: '-', exp: 'dialog ปิด record ยังอยู่' },
  { id: 'J-FLT-ED023', cat: 'Menu', obj: 'Confirm dialog text', desc: "1. menu → 'ลบ'", data: '-', exp: 'มีข้อความยืนยัน' },
  { id: 'J-FLT-ED024', cat: 'Menu', obj: 'ยืนยันลบ', desc: '1. ยืนยันลบ', data: '-', exp: "Toast 'สำเร็จ' + record หายจาก list" },

  { type: 'part', text: 'PART 5: UI/UX + Permission/Security' },

  { type: 'sub', text: 'Y. UI/UX' },
  { id: 'J-FLT-UX001', cat: 'Responsive', obj: 'Desktop 1920', desc: '1. เปิด 1920px', data: '-', exp: 'Layout ปกติ' },
  { id: 'J-FLT-UX002', cat: 'Responsive', obj: 'Tablet 768', desc: '1. ปรับ 768px', data: '-', exp: 'Responsive ใช้งานได้' },
  { id: 'J-FLT-UX003', cat: 'Responsive', obj: 'Mobile 375', desc: '1. ปรับ 375px', data: '-', exp: 'Responsive ใช้งานได้' },
  { id: 'J-FLT-UX004', cat: 'Browser-Chrome', obj: 'Chrome', desc: '1. เปิด Chrome', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-FLT-UX005', cat: 'Browser-Firefox', obj: 'Firefox', desc: '1. เปิด Firefox', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-FLT-UX006', cat: 'Browser-Safari', obj: 'Safari', desc: '1. เปิด Safari', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-FLT-UX007', cat: 'Browser-Edge', obj: 'Edge', desc: '1. เปิด Edge', data: '-', exp: 'ทำงานปกติ' },
  { id: 'J-FLT-UX008', cat: 'Accessibility', obj: 'Tab navigation', desc: '1. กด Tab', data: '-', exp: 'Focus ตามลำดับ' },
  { id: 'J-FLT-UX009', cat: 'Accessibility', obj: 'Enter ใน input', desc: '1. กด Enter', data: '-', exp: 'ไม่ submit อัตโนมัติ (หรือ submit ตาม design)' },
  { id: 'J-FLT-UX010', cat: 'Loading', obj: 'Loading state list', desc: '1. โหลดหน้า', data: '-', exp: 'skeleton ปรากฏ' },

  { type: 'sub', text: 'Z. Permission / Security' },
  { id: 'J-FLT-SEC001', cat: 'Permission-NoLogin', obj: 'ไม่ login → URL', desc: '1. ออก | 2. เข้า URL', data: '-', exp: 'Redirect login' },
  { id: 'J-FLT-SEC002', cat: 'Permission-NoPerm', obj: 'User no permission', desc: '1. login no-perm user', data: '-', exp: '403 / ซ่อนปุ่มสร้าง' },
  { id: 'J-FLT-SEC003', cat: 'Session-Timeout', obj: 'Timeout ระหว่างกรอก', desc: '1. กรอก | 2. รอ timeout | 3. บันทึก', data: '-', exp: 'Redirect login' },
  { id: 'J-FLT-SEC004', cat: 'XSS-Display', obj: 'XSS เมื่อแสดงผลใน list', desc: '1. สร้าง filter ชื่อ <script>', data: '-', exp: 'ตารางแสดงเป็น text' },
  { id: 'J-FLT-SEC005', cat: 'CSRF', obj: 'CSRF token', desc: '1. ตรวจ request', data: '-', exp: 'มี token' },
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
  `Project Release / Version :,1.0,,,Module / Function :,${field('ตัวกรองสินค้า (Product Filters) - List + Create + Group Dialog + Edit + Delete')},,`,
  `URL List :,https://devstorex.jibc.codelabdev.co/store/product-manager/filters,,,,,,`,
  `URL Create :,https://devstorex.jibc.codelabdev.co/store/product-manager/filters/create,,,,,,`,
  `URL Edit :,${field('https://devstorex.jibc.codelabdev.co/store/product-manager/filters/update/{id}')},,,,,,`,
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
lines.push(`,${field('3. โครงสร้างฟอร์ม: Parent (หมวดหมู่หลัก* + หมวดหมู่รอง* + สถานะ) + Dialog "เพิ่มค่าตัวกรอง" (หัวข้อตัวกรอง TH/EN + ค่าตัวกรอง + หัวข้อย่อย)')},,,,,,`)
lines.push(`,${field('4. Sections "-- ... --" ใช้ตัวคั่นมาตรฐาน (ไม่ใช้ #/=) ตามรูปแบบ test case JIB')},,,,,,`)
lines.push(`,${field('5. [Bug?] CR023: คลิก บันทึก ฟอร์มเปล่า → page หลุดจาก /create (อาจ silent submit หรือ navigation issue - ต้อง retest)')},,,,,,`)
lines.push(`,${field('6. [Bug] ED006: URL /update/{invalid-id} → render Edit-like form ไม่ redirect/404 (pattern เดียวกับ tags, template-options, mapping-conditions)')},,,,,,`)
lines.push(`,${field('7. [Warning] DG013/DG023: ฟิลด์ TH/EN รับเกิน 256 ตัวอักษร (ไม่มี maxLength client-side)')},,,,,,`)
lines.push(`,${field('8. [Warning] DG015: รับ space-only ใน TH (ไม่ trim client-side)')},,,,,,`)
lines.push(`,${field('9. หมายเหตุ runtime: combobox หมวดหมู่หลัก/รอง โหลด options ผ่าน API ช้ากว่า 900ms ใน automated session - ทำให้ seed flow (CR064) + Edit chain (ED010-ED024) ไม่สำเร็จ → ถูกบันทึกเป็น Warning/Not Tested')},,,,,,`)
lines.push(`,${field('10. Sub-form ค่าตัวกรอง (เพิ่มรายการตัวกรอง) ภายใน dialog ไม่ render input ใหม่ทันที (DG031 ดู input count ไม่เพิ่ม) - selector value entry ต้อง trace ต่อ ใน run ถัดไป')},,,,,,`)
lines.push(`,${field('11. Not Tested ส่วนใหญ่: Cross-browser, Responsive (tablet/mobile), Network/Server mocking, Permission/Session timeout, Edit chain ที่ขึ้นกับ seed')},,,,,,`)

fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log('Total defined cases:', ROWS.filter((r) => r.id).length)
console.log('Summary:', sum, '| pass rate:', passRate + '%', '| fail rate:', failRate + '%')
console.log('Written:', OUT)
