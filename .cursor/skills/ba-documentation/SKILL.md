---
name: ba-documentation
description: >-
  Reverse-engineers Cypress/Playwright E2E tests and test-case CSVs into Thai
  business documentation (feature overview, workflow, human manual, validation
  rules). Use when the user asks for BA docs, user manuals, flow documentation,
  คู่มือผู้ใช้, เอกสารธุรกิจ, or to translate automation scripts for customers.
---

# BA Documentation (Thai User & Business Docs)

## When to apply

- User provides or points to E2E tests (`cypress/e2e/*.cy.js`, Playwright specs) or `JIB_TestCases_*_Full.csv`
- User wants **Thai**, **customer-facing**, **no technical jargon** (no locators, CSS, Cypress, `expect`)
- User asks for: ภาพรวม, flow, คู่มือมนุษย์, เงื่อนไข, business rules

## Workflow

1. **Identify scope** — module name, URLs from CSV header rows, `describe` blocks in tests
2. **Read sources** (in order):
   - Matching `JIB_TestCases_*_Full.csv` if exists
   - Matching `cypress/e2e/<module>.cy.js`
   - Related modules mentioned in CSV Notes (dependencies)
3. **Extract user journey** — map helpers (`openCreate`, `fillForm`, `clickSave`) to human steps with **exact UI labels** from `cy.contains('button', '...')` and CSV Actual Result columns
4. **Write four sections** in Markdown, Thai, professional tone:

### Required output structure (JIB user manual style)

Match `docs/เทมเพลตคุณสมบัติ-คู่มือผู้ใช้.md`:

```markdown
# คู่มือการใช้งาน: [ชื่อฟีเจอร์]
**เมนู:** ... **URL:** ...
(ย่อหน้าอธิบายฟีเจอร์ 1–2 บรรทัด)
> คู่มือนี้เริ่มที่ [หน้าแรกของฟีเจอร์] โดยสมมติว่าผู้ใช้เข้าสู่ระบบและเปิดเมนูนี้แล้ว

## 1. หน้ารายการ ...
## 2. การสร้าง ...
## 3. การแก้ไข ...
## 4. การคัดลอก/ลบ (ถ้ามี)
## 5. เงื่อนไขและข้อควรระวัง
```

**Do NOT include:**
- หน้าปก / สารบัญ / หน่วยจัดทำ
- หัวข้อ **「การเข้าสู่ระบบ」** หรือ **「การเปิดเมนู」** เป็นขั้นตอน numbered (เช่น 1.1.1 login)
- Screenshot หน้า Sign-in

**DO include at top (metadata only):** เมนู path + URL หนึ่งบรรทัด — ไม่นับเป็นขั้นตอน

**Numbering:** `X.Y.Z` steps + **หน้าจอ...** caption + image after each major step

**Screenshots (Cypress):** `cy.session` login แล้ว `cy.visit(LIST_URL)` ทันที — ภาพแรกต้องเป็นหน้าฟีเจอร์ ไม่ใช่หน้า login

Avoid mermaid unless user asks.

## Writing rules

| Do | Don't |
|----|--------|
| Use button/field labels exactly as in UI | Mention Playwright, Cypress, selectors, `expect` |
| Say "คลิกปุ่ม 「บันทึก」" | Say `cy.get('button[type="submit"]')` |
| Note Pass/Fail/Warning from CSV as "ข้อจำกัดที่ควรทราบ" | Present failed tests as if they work |
| Separate List / Create / Edit flows | Merge into one vague paragraph |
| Include dependency diagram for related modules | Assume reader knows template-options, mapping-conditions |

## Label extraction cheatsheet

From Cypress tests in this repo:

- Buttons: `cy.contains('button', '...')`
- Tabs: `switchToDisplay` → 「การแสดงผล」, `switchToMapping` → 「Mapping」
- Placeholders: `input[placeholder="ค้นหา"]` → ช่อง 「ค้นหา」
- Toasts: `/สำเร็จ/` → ข้อความแจ้งสำเร็จ
- Errors: `cy.contains('กรุณา...')` → ตาราง validation

## Optional deliverable

Save to `docs/<feature-slug>-คู่มือผู้ใช้.md` when user wants a file in the repo.

## Example projects

| Module | Test file | CSV |
|--------|-----------|-----|
| เทมเพลตคุณสมบัติ | `cypress/e2e/template-attributes.cy.js` | `JIB_TestCases_TemplateAttributes_Full.csv` |
| แบรนด์สินค้า | `cypress/e2e/brand.cy.js` | `JIB_TestCases_Brands_Full.csv` |
| โปรโมชั่น | `cypress/e2e/promotions.cy.js` | — |
| ของแถม | `cypress/e2e/free-gifts.cy.js` | — |

## Screenshot / E2E standard (required for 「การสร้าง」sections)

For every feature manual, Cypress screenshot specs must **complete the real create flow end-to-end**, not stop at the first wizard step or empty form.

Minimum capture for create flows:

1. List page (starting point)
2. Open create + fill required fields
3. **Full wizard / dialog** — every step until item/sub-record is saved back to parent
4. Parent save + success toast
5. Verify new record on list (search or visible row)

Promotions (Discount) reference: `cypress/e2e/promotions-screenshots.cy.js` → images `10`–`18` in `docs/images/promotions/`.

Product picker pattern in this repo: select checkbox in dialog → click **`ยืนยัน (n)`** (not 「เพิ่ม」).

## Quality checklist

- [ ] Starts at feature page (List), NOT login flow
- [ ] No cover/TOC/login numbered sections
- [ ] Create flow documented **step-by-step through completion** (wizard all steps + parent save + list verify)
- [ ] Screenshots match numbered steps (หน้าจอ... + image after each major step)
- [ ] Create + Edit + List (+ Delete/Copy if tested) covered
- [ ] Mandatory vs optional fields in a table
- [ ] Known bugs/limitations from CSV Fail/Warning rows documented honestly
- [ ] No code blocks except mermaid for flows
- [ ] Empathetic tone for non-technical readers
