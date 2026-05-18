/**
 * Discovery script: login -> ไปหน้า template-attributes -> เปิดฟอร์มสร้าง -> dump DOM
 *
 * รัน: node scripts/discover-template-form.js
 * จะเปิด WebKit แบบ headed ให้คุณกด/รอจนเห็นฟอร์ม แล้วกด Enter ใน terminal
 * สคริปต์จะ dump HTML ของ <body> ลง scripts/template-form.html
 */

const { webkit } = require('playwright-webkit');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const EMAIL = 'admin00@email.com';
const PASSWORD = 'password123';
const BASE_URL = 'https://backoffice.jibc.codelabdev.co';
const TARGET_URL = `${BASE_URL}/store/product-manager/template-attributes`;
const OUT_DIR = path.join(__dirname);
const OUT_HTML = path.join(OUT_DIR, 'template-form.html');
const OUT_LIST = path.join(OUT_DIR, 'template-form-list.txt');
const OUT_SHOT = path.join(OUT_DIR, 'template-form.png');

const AUTO = process.env.AUTO === '1' || process.argv.includes('--auto');

function pause(message) {
  if (AUTO) {
    console.log(`[auto] skip: ${message}`);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(message, () => { rl.close(); resolve(); });
  });
}

(async () => {
  const browser = await webkit.launch({ headless: AUTO });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1) เปิดหน้า login...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  console.log('2) login...');
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await page.waitForLoadState('networkidle').catch(() => {});

  console.log('3) ไปหน้า template-attributes...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' }).catch(() => {});

  console.log('4) กดปุ่ม "เพิ่มเทมเพลต"...');
  await page.getByRole('button', { name: /เพิ่มเทมเพลต/ }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, 'debug-after-add.png'), fullPage: true });

  console.log('5) รอ form load และเปิด dropdown "หมวดหมู่หลัก"...');
  // รอจนเห็นข้อความ "ข้อมูลพื้นฐาน" ก่อน
  await page.getByText('ข้อมูลพื้นฐาน').first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  // หา trigger ของ dropdown หมวดหมู่หลัก — combobox จะอยู่ใต้ label "หมวดหมู่หลัก"
  // ใช้ text "เลือกหมวดหมู่หลัก" (ไม่ตามด้วย "ก่อน")
  await page.getByText('เลือกหมวดหมู่หลัก', { exact: true }).first().click({ timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, 'debug-dropdown.png'), fullPage: true });

  const dropdownInfo = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll(
      '[role="option"], [role="listbox"], [role="menuitem"], [cmdk-item], [data-radix-collection-item], [data-slot*="item"], [data-state="open"]'
    ));
    return candidates.slice(0, 30).map((el) => ({
      role: el.getAttribute('role'),
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.textContent || '').trim().slice(0, 60),
      cmdkItem: el.hasAttribute('cmdk-item'),
      dataSlot: el.getAttribute('data-slot'),
      classes: (el.className || '').toString().slice(0, 160),
    }));
  });

  console.log('\n>>> ตรวจในเบราว์เซอร์ — ควรเห็น dropdown เปิดอยู่');
  await pause('    เมื่อพร้อม กด Enter เพื่อ dump DOM... ');

  console.log('4) เก็บ DOM และ screenshot...');

  await page.screenshot({ path: OUT_SHOT, fullPage: true });

  const html = await page.content();
  fs.writeFileSync(OUT_HTML, html, 'utf8');

  const elements = await page.evaluate(() => {
    const pick = (el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type') || null,
      name: el.getAttribute('name') || null,
      id: el.getAttribute('id') || null,
      placeholder: el.getAttribute('placeholder') || null,
      ariaLabel: el.getAttribute('aria-label') || null,
      dataTestid: el.getAttribute('data-testid') || null,
      role: el.getAttribute('role') || null,
      text: (el.innerText || el.textContent || '').trim().slice(0, 80),
      classes: (el.className || '').toString().slice(0, 120),
    });
    const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(pick);
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).map(pick);
    const labels = Array.from(document.querySelectorAll('label')).map((l) => ({
      text: (l.innerText || l.textContent || '').trim(),
      for: l.getAttribute('for') || null,
    }));
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,p[class*="title"],div[class*="title"]'))
      .map((h) => (h.innerText || h.textContent || '').trim())
      .filter(Boolean)
      .slice(0, 30);
    return { inputs, buttons, labels, headings };
  });

  const lines = [];
  lines.push('=== HEADINGS / TITLES ===');
  elements.headings.forEach((h) => lines.push(`  - ${h}`));
  lines.push('\n=== INPUTS / TEXTAREAS / SELECTS ===');
  elements.inputs.forEach((e) => lines.push(`  - <${e.tag}> name="${e.name}" type="${e.type}" id="${e.id}" placeholder="${e.placeholder}" aria-label="${e.ariaLabel}" data-testid="${e.dataTestid}"`));
  lines.push('\n=== BUTTONS ===');
  elements.buttons.forEach((e) => lines.push(`  - <${e.tag}> text="${e.text}" data-testid="${e.dataTestid}" aria-label="${e.ariaLabel}"`));
  lines.push('\n=== LABELS ===');
  elements.labels.forEach((l) => lines.push(`  - "${l.text}" for="${l.for}"`));
  lines.push('\n=== DROPDOWN OPTIONS (หมวดหมู่หลัก) ===');
  dropdownInfo.forEach((e) => lines.push(`  - <${e.tag}> role="${e.role}" cmdk=${e.cmdkItem} data-slot="${e.dataSlot}" text="${e.text}" class="${e.classes}"`));

  fs.writeFileSync(OUT_LIST, lines.join('\n'), 'utf8');

  console.log('\nเสร็จแล้ว เขียนผลลง:');
  console.log('  -', OUT_HTML);
  console.log('  -', OUT_LIST);
  console.log('  -', OUT_SHOT);
  console.log('\nกด Enter เพื่อปิด browser');
  await pause('');
  await browser.close();
})();
