/**
 * จัดระเบียบไฟล์ test cases เข้า testcases/
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const CSV_DIR = path.join(ROOT, 'testcases/csv')
const RESULTS_DIR = path.join(ROOT, 'testcases/results')

fs.mkdirSync(CSV_DIR, { recursive: true })
fs.mkdirSync(RESULTS_DIR, { recursive: true })

// Move CSV from root
for (const f of fs.readdirSync(ROOT)) {
  if (f.startsWith('JIB_TestCases_') && f.endsWith('.csv')) {
    const src = path.join(ROOT, f)
    const dest = path.join(CSV_DIR, f)
    if (!fs.existsSync(dest)) fs.renameSync(src, dest)
    else fs.unlinkSync(src)
    console.log('CSV:', f)
  }
}

// Move results from scripts/
const scriptsDir = path.join(ROOT, 'scripts')
for (const f of fs.readdirSync(scriptsDir)) {
  if (f.endsWith('-test-results.json') || f === 'live-verify-results.json') {
    const src = path.join(scriptsDir, f)
    const dest = path.join(RESULTS_DIR, f)
    if (!fs.existsSync(dest)) fs.renameSync(src, dest)
    console.log('JSON:', f)
  }
}

console.log('✅ Organized into testcases/csv and testcases/results')
