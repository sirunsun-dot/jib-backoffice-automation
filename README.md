# JIB Backoffice Automation

Cypress E2E + Puppeteer automated tests สำหรับ JIB Backoffice (35 ฟังก์ชันตาม Sidebar)

## Quick Start

```bash
npm install
export CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# รันเทสทุกฟังก์ชัน + สร้าง CSV + Dashboard
npm run test:all

# ดูสรุปสถานะ
open JIB_TestStatus_Dashboard.csv

# สร้างสินค้า E2E จนจบ (Cypress — ~2-3 นาที)
npm run test:products:e2e
```

## โครงสร้าง

```
testcases/csv/          ← Test Case CSV ทุกฟังก์ชัน (35 ไฟล์)
testcases/results/      ← ผลรัน JSON
JIB_TestStatus_Dashboard.csv  ← สรุปสถานะรวม
cypress/e2e/            ← Cypress specs
scripts/                ← Test runners & builders
```

## Login

- URL: https://devstorex.jibc.codelabdev.co/auth/sign-in
- Email: sirun.sun@codelabdev.co
- Password: test123

ดูรายละเอียดเพิ่มใน `commands.txt`, `testcases/README.md` และ **`docs/BUSINESS_FLOWS.md`**


