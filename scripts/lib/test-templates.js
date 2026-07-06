/**
 * Generate standard test case definitions for any Backoffice module
 */
function buildTestCases(mod) {
  const P = mod.id
  const hasCreate = !!mod.createUrl
  const hasTable = mod.pageType !== 'settings' && mod.pageType !== 'login'
  const rows = []

  const part = (text) => rows.push({ type: 'part', text })
  const sub = (text) => rows.push({ type: 'sub', text })
  const tc = (id, cat, obj, desc, exp) => rows.push({ id: `J-${P}-${id}`, cat, obj, desc: desc, data: '-', exp })

  if (mod.pageType === 'login') {
    part('PART 1: เข้าสู่ระบบ')
    tc('LG001', 'Login', 'เปิดหน้า Sign-in', '1. เปิด /auth/sign-in', 'แสดงฟอร์ม email + password + ปุ่มเข้าสู่ระบบ')
    tc('LG002', 'Login', 'กรอก credentials ถูกต้อง', '1. กรอก email/password | 2. คลิกเข้าสู่ระบบ', 'redirect ออกจาก /auth/sign-in')
    tc('LG003', 'Login', 'กรอก email ว่าง', '1. ไม่กรอก email + คลิกเข้าสู่ระบบ', 'validation error')
    tc('LG004', 'Login', 'กรอก password ว่าง', '1. กรอก email อย่างเดียว', 'validation error')
    tc('LG005', 'Login', 'กรอก password ผิด', '1. email ถูก password ผิด', 'ไม่เข้าระบบ / แสดง error')
    tc('LG006', 'UI', 'แสดง branding JIB', '1. ดูหน้า', 'แสดง JIB Backoffice branding')
    return rows
  }

  if (hasTable) {
    part('PART 1: หน้า List')
    sub('A. การโหลดหน้า + UI')
    tc('LP001', 'Page Load', 'เปิดหน้ารายการ', `1. เข้า ${mod.url}`, 'หน้าโหลดสำเร็จ ไม่ error')
    tc('LP002', 'UI', 'ตรวจสอบ Heading', '1. ดูหัวข้อหน้า', `แสดง heading ที่เกี่ยวข้องกับ ${mod.name}`)
    tc('LP003', 'UI', 'ตรวจสอบตาราง', '1. ดูตารางข้อมูล', 'แสดงตารางพร้อมแถวข้อมูล')
    tc('LP004', 'UI', 'ตรวจสอบคอลัมน์', '1. ดูหัวคอลัมน์', 'มีคอลัมน์ครบตาม design')
    tc('LP005', 'UI', 'Action Bar', '1. ดู toolbar', 'มีช่องค้นหา / ตัวกรอง / ปรับแต่งคอลัมน์')
    tc('LP006', 'UI', 'ไม่มี undefined ในข้อมูล', '1. ดูข้อมูลในตาราง', "ไม่พบคำว่า 'undefined'")
    tc('LP007', 'UI', 'ปุ่มเพิ่ม (ถ้ามี)', '1. ดูปุ่มเพิ่ม', hasCreate ? 'มีปุ่มเพิ่ม/สร้าง' : 'ไม่จำเป็นต้องมีปุ่มเพิ่ม')

    sub('B. การค้นหา')
    tc('LP010', 'Search', 'ค้นหาภาษาไทย', '1. พิมพ์ keyword ไทย', 'กรองผลลัพธ์')
    tc('LP011', 'Search', 'ค้นหา keyword ไม่มี', '1. พิมพ์คำที่ไม่มี', 'empty state / 0 รายการ')
    tc('LP012', 'Search', 'XSS ใน search', '1. พิมพ์ <script>', 'รับเป็น plain text ไม่ execute')
    tc('LP013', 'Search', 'เคลียร์ search', '1. ลบ keyword', 'กลับสู่ list เต็ม')

    sub('C. ตัวกรอง')
    tc('LP020', 'Filter', 'เปิดตัวกรอง', '1. คลิกตัวกรอง', 'เปิด panel/sheet')
    tc('LP021', 'Filter', 'ปิดด้วย ESC', '1. กด ESC', 'panel ปิด')
    tc('LP022', 'Filter', 'Apply filter', '1. ตั้งเงื่อนไข + ตกลง', 'กรอง list')

    sub('D. ปรับแต่งคอลัมน์')
    tc('LP030', 'Customize', 'เปิด menu', '1. คลิกปรับแต่งคอลัมน์', 'เปิด dropdown')
    tc('LP031', 'Customize', 'ซ่อน/เปิดคอลัมน์', '1. toggle checkbox', 'คอลัมน์เปลี่ยนตาม')

    sub('E. Pagination')
    tc('LP040', 'Pagination', 'Footer แสดงจำนวน', '1. ดู footer', "รูปแบบ 'X - Y จาก Z'")
    tc('LP041', 'Rows', 'เลือกจำนวนแถว', '1. เปลี่ยน rows per page', 'จำนวนแถวเปลี่ยน')
    tc('LP042', 'Pagination', 'เปลี่ยนหน้า', '1. คลิกหน้าถัดไป', 'ไปหน้าถัดไป')

    sub('F. Row Actions')
    tc('LP050', 'Row', 'ปุ่ม Edit (ถ้ามี)', '1. คลิกไอคอนแก้ไข', 'ไปหน้า edit')
    tc('LP051', 'Row', '3-dot menu (ถ้ามี)', '1. คลิกเมนู', 'แสดงตัวเลือก')
  }

  if (mod.pageType === 'settings') {
    part('PART 1: หน้าตั้งค่า')
    tc('ST001', 'Page Load', 'เปิดหน้าตั้งค่า', `1. เข้า ${mod.url}`, 'หน้าโหลดสำเร็จ')
    tc('ST002', 'UI', 'แสดงฟอร์ม/ตาราง', '1. ดูเนื้อหา', 'มี input หรือตารางตั้งค่า')
    tc('ST003', 'UI', 'ปุ่มบันทึก (ถ้ามี)', '1. ดูปุ่ม', 'มีปุ่มบันทึกหรือแก้ไข')
    tc('ST004', 'Save', 'บันทึกการตั้งค่า', '1. แก้ค่า + บันทึก', 'บันทึกสำเร็จ / toast')
  }

  if (hasCreate) {
    part('PART 2: หน้า Create')
    tc('CR001', 'UI', 'เปิดหน้า Create', `1. เข้า ${mod.createUrl}`, 'แสดงฟอร์มเพิ่ม/สร้าง')
    tc('CR002', 'UI', 'ฟิลด์ในฟอร์ม', '1. ดูฟิลด์', 'มี input ครบ')
    tc('CR003', 'UI', 'ปุ่มบันทึก', '1. ดูปุ่ม', 'มีปุ่มบันทึก')
    tc('CR004', 'Validation', 'บันทึกฟอร์มว่าง', '1. ไม่กรอก + บันทึก', 'แสดง validation error')
    tc('CR005', 'Validation', 'กรอกชื่อ TH', '1. กรอกชื่อภาษาไทย', 'รับค่าได้')
    tc('CR006', 'Validation', 'XSS ในชื่อ', '1. กรอก <script>', 'รับเป็น text')
    tc('CR007', 'Sync', 'Toggle sync TH/EN', '1. คลิก sync toggle', 'เปลี่ยน state')
    tc('CR008', 'Save', 'บันทึกข้อมูลครบ', '1. กรอกครบ + บันทึก', 'บันทึกสำเร็จ + redirect')
  }

  part(hasCreate ? 'PART 3: หน้า Edit' : 'PART 2: การเข้าถึง')
  if (hasCreate) {
    tc('ED001', 'Edit', 'Invalid ID', '1. เปิด /update/99999999', '404 หรือ redirect (ไม่แสดงฟอร์มเปล่า)')
    tc('ED002', 'Edit', 'เปิด Edit record จริง', '1. คลิกแก้ไขจาก list', 'โหลดข้อมูลเดิม')
    tc('ED003', 'Edit', 'บันทึกการแก้ไข', '1. แก้ชื่อ + บันทึก', 'อัพเดตสำเร็จ')
  }

  part(hasCreate ? 'PART 4: UI/UX + Security' : 'PART 3: UI/UX + Security')
  tc('UX001', 'Responsive', 'Desktop 1920px', '1. เปิด viewport 1920', 'Layout ปกติ')
  tc('UX002', 'Browser', 'Chromium', '1. เปิดบน Chrome', 'ทำงานปกติ')
  tc('SEC001', 'Session', 'เข้าหน้าหลัง login', '1. login แล้วเข้า URL', 'เข้าได้ไม่ redirect')

  return rows
}

function getCaseIds(rows) {
  return rows.filter((r) => r.id).map((r) => r.id)
}

module.exports = { buildTestCases, getCaseIds }
