# Test Cases — JIB Backoffice

## โครงสร้างโฟลเดอร์

```
testcases/
├── csv/                          # ไฟล์ Test Case ทุกฟังก์ชัน
│   └── JIB_TestCases_{Module}_Full.csv
└── results/                      # ผลรัน automated tests (JSON)
    └── {module-id}-test-results.json

JIB_TestStatus_Dashboard.csv      # สรุปสถานะทุกฟังก์ชัน (root)
```

## คำสั่ง

```bash
# รันเทสทุกฟังก์ชัน (browser เดียว, login ครั้งเดียว)
node scripts/run-all-module-tests.js

# รันเฉพาะที่ยังไม่มี results
node scripts/run-all-module-tests.js --skip-existing

# รันเฉพาะบางโมดูล
node scripts/run-all-module-tests.js --only=CAT,BR,SUP

# สร้าง CSV ทุกโมดูล
node scripts/build-all-module-csvs.js

# สร้าง Dashboard สรุป
npm run dashboard

# Pipeline เต็ม
npm run test:all
```

## รูปแบบ Test Case ID

`J-{MODULE}-{SECTION}{NNN}`

| Section | ความหมาย |
|---------|----------|
| LP | List Page |
| CR | Create |
| ED | Edit |
| ST | Settings |
| LG | Login |
| UX | UI/UX |
| SEC | Security |

## Result Values

- **Pass** — ผ่าน
- **Fail** — พบบัค
- **Warning** — ทดสอบแล้วแต่มีข้อสงสัย / ข้าม E2E
- **Not Tested** — ยังไม่ได้รัน (ควรเป็น 0 หลัง `npm run test:all`)
