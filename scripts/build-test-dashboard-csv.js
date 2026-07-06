/**
 * สร้าง JIB_TestStatus_Dashboard.csv — ตารางสรุปสถานะการทดสอบทุกฟังก์ชัน Backoffice
 */
const fs = require('fs')
const path = require('path')
const { DASHBOARD_CSV, LIVE_JSON, csvFile, RESULTS_DIR } = require('./lib/paths')
const { BASE, MODULES } = require('./modules-config')

const SIGNIN = `${BASE}/auth/sign-in`
const EMAIL = 'sirun.sun@codelabdev.co'
const PASSWORD = 'test123'

function field(s) {
  if (s == null) return ''
  s = String(s)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function parseSummary(csvPath) {
  if (!fs.existsSync(csvPath)) return null
  const text = fs.readFileSync(csvPath, 'utf8')
  const lines = text.split('\n')
  const summary = {}
  const keys = ['Total Test Cases', 'Pass', 'Fail', 'Warning', 'Not Tested', 'Pass Rate']
  for (const line of lines) {
    for (const key of keys) {
      const re = new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*,\\s*([^,]+)`)
      const m = line.match(re)
      if (m) summary[key] = m[1].trim()
    }
  }
  return summary
}

function parseCsvLine(line) {
  const cols = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++ } else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) { cols.push(cur); cur = '' }
    else cur += ch
  }
  cols.push(cur)
  return cols
}

function parseAllTestRows(csvPath) {
  if (!fs.existsSync(csvPath)) return []
  const text = fs.readFileSync(csvPath, 'utf8')
  const lines = text.split('\n')
  const rows = []
  let inData = false
  for (const line of lines) {
    if (line.startsWith('Test Case ID,Category')) { inData = true; continue }
    if (!inData) continue
    if (line.includes('สรุปผลทดสอบรวม')) break
    if (!line.trim() || line.startsWith('----') || line.startsWith('--')) continue
    const cols = parseCsvLine(line)
    const id = cols[0]
    if (!id || !id.startsWith('J-')) continue
    rows.push({ id, category: cols[1], objective: cols[2], actual: cols[6], result: (cols[7] || '').trim() })
  }
  return rows
}

function overallStatus(summary) {
  if (!summary) return 'ยังไม่มี CSV'
  const fail = Number(summary.Fail) || 0
  const notTested = Number(summary['Not Tested']) || 0
  const passRate = parseFloat(summary['Pass Rate']) || 0
  if (fail > 0) return `มีบัค (${fail} Fail)`
  if (notTested > 0) return `ค้างเทส (${notTested})`
  if (passRate >= 85) return 'ทดสอบผ่านแล้ว'
  return 'ทดสอบบางส่วน'
}

const today = new Date().toISOString().slice(0, 10)
let liveData = null
try { liveData = JSON.parse(fs.readFileSync(LIVE_JSON, 'utf8')) } catch {}

const lines = []
lines.push(`Project Name :,JIB Backoffice Test Status Dashboard,,,อัปเดตล่าสุด :,${today},,`)
lines.push(`Environment :,${BASE},,,Sign-in URL :,${SIGNIN},,`)
lines.push(`Tester :,${EMAIL},,,Password :,${PASSWORD},,`)
lines.push(`โฟลเดอร์ Test Cases :,testcases/csv/,,,ผลทดสอบ :,testcases/results/,,`)
lines.push(`เอกสาร Business Flow :,docs/BUSINESS_FLOWS.md,,,,,,`)
lines.push('')
lines.push('---- Business Context (จาก BA) ----,,,,,,,,,,,,')
lines.push('ฟังก์ชัน,กลุ่ม,คำอธิบาย Business,,,,,,,,,,,')
lines.push('')
MODULES.filter((m) => m.businessContext).forEach((m) => {
  lines.push([m.name, m.group, m.businessContext].map(field).join(','))
})
lines.push('')

// Group summary
const groups = {}
MODULES.forEach((m) => { if (!groups[m.group]) groups[m.group] = []; groups[m.group].push(m) })

lines.push('---- สรุปตามกลุ่ม Sidebar ----,,,,,,,,,,,,')
lines.push('กลุ่ม,จำนวนฟังก์ชัน,มี CSV,Pass Rate เฉลี่ย,Fail รวม,Not Tested รวม,,,,,,,,')
lines.push('')

let grand = { total: 0, pass: 0, fail: 0, warning: 0, notTested: 0, modules: 0, withCsv: 0 }
const moduleStats = []

for (const [group, mods] of Object.entries(groups)) {
  let gTotal = 0, gPass = 0, gFail = 0, gNT = 0, gCount = 0, gWithCsv = 0
  for (const mod of mods) {
    const csvPath = csvFile(mod.csvName)
    const summary = fs.existsSync(csvPath) ? parseSummary(csvPath) : null
    const rows = summary ? parseAllTestRows(csvPath) : []
    moduleStats.push({ mod, summary, rows, csvPath })

    if (summary) {
      gWithCsv++
      gCount++
      const t = Number(summary['Total Test Cases']) || 0
      gTotal += t
      gPass += Number(summary.Pass) || 0
      gFail += Number(summary.Fail) || 0
      gNT += Number(summary['Not Tested']) || 0
      grand.total += t
      grand.pass += Number(summary.Pass) || 0
      grand.fail += Number(summary.Fail) || 0
      grand.warning += Number(summary.Warning) || 0
      grand.notTested += Number(summary['Not Tested']) || 0
      grand.withCsv++
    }
    grand.modules++
  }
  const gRate = gTotal ? ((gPass / gTotal) * 100).toFixed(1) : '-'
  lines.push([group, mods.length, gWithCsv, `${gRate}%`, gFail, gNT].map(field).join(','))
}
lines.push('')

const grandRate = grand.total ? ((grand.pass / grand.total) * 100).toFixed(1) : '0'
lines.push(`รวมทั้งระบบ:,${grand.modules} ฟังก์ชัน,${grand.withCsv} CSV,${grand.total} cases,Pass ${grand.pass},Fail ${grand.fail},Warning ${grand.warning},Not Tested ${grand.notTested},Pass Rate ${grandRate}%,,,,,`)
lines.push('')

// Live verify section
if (liveData?.summary) {
  lines.push('---- Live Smoke Test ล่าสุด ----,,,,,,,,,,,,')
  lines.push(`ตรวจเมื่อ :,${liveData.finished},,,Pass :,${liveData.summary.Pass},Warning :,${liveData.summary.Warning},Fail :,${liveData.summary.Fail},,,`)
  lines.push(['ลำดับ', 'กลุ่ม', 'Sidebar', 'ฟังก์ชัน', 'URL', 'Live', 'List', 'Create', 'InvalidID', 'แถว', 'ปัญหา'].join(','))
  lines.push('')
  MODULES.forEach((mod, i) => {
    const live = liveData.modules?.[mod.id]
    if (!live) return
    lines.push([i + 1, mod.group, mod.sidebar, mod.name, mod.url, live.overall,
      live.list?.status || '-', live.create?.status || '-', live.invalidEdit?.status || '-',
      live.list?.checks?.tableRows ?? '-', (live.issues || []).join(' | ') || '-'].map(field).join(','))
  })
  lines.push('')
}

// Main module table
lines.push('---- รายละเอียดทุกฟังก์ชัน (Module Detail) ----,,,,,,,,,,,,')
lines.push([
  'ลำดับ', 'กลุ่ม Sidebar', 'ชื่อ Sidebar', 'ฟังก์ชัน', 'URL',
  'ไฟล์ CSV', 'Runner', 'Total', 'Pass', 'Fail', 'Warning', 'Not Tested', 'Pass Rate %',
  'สถานะ', 'Live Smoke', 'Cypress', 'หมายเหตุ',
].join(','))
lines.push('')

MODULES.forEach((mod, i) => {
  const stat = moduleStats.find((s) => s.mod.id === mod.id)
  const summary = stat?.summary
  const csvPath = `testcases/csv/${mod.csv}`
  const runner = mod.runner === 'specialized' ? mod.specializedScript : 'generic module-runner'
  const live = liveData?.modules?.[mod.id]?.overall || '-'

  lines.push([
    i + 1, mod.group, mod.sidebar, mod.name, mod.url,
    summary ? csvPath : 'ยังไม่มี',
    runner,
    summary ? summary['Total Test Cases'] : '-',
    summary ? summary.Pass : '-',
    summary ? summary.Fail : '-',
    summary ? summary.Warning : '-',
    summary ? summary['Not Tested'] : '-',
    summary ? summary['Pass Rate'] : '-',
    overallStatus(summary),
    live,
    mod.cypress,
    mod.bugs || mod.businessContext || '-',
  ].map(field).join(','))
})
lines.push('')

// Fail details
lines.push('---- รายการ Fail ทั้งหมด (บัค) ----,,,,,,,,,,,,')
lines.push('Test Case ID,ฟังก์ชัน,กลุ่ม,Category,Objective,Actual Result,URL')
lines.push('')
for (const { mod, rows } of moduleStats) {
  for (const r of rows.filter((x) => x.result === 'Fail')) {
    lines.push([r.id, mod.name, mod.group, r.category, r.objective, r.actual, mod.url].map(field).join(','))
  }
}

lines.push('')
lines.push('---- รายการ Warning ทั้งหมด ----,,,,,,,,,,,,')
lines.push('Test Case ID,ฟังก์ชัน,Category,Objective,Actual Result')
lines.push('')
for (const { mod, rows } of moduleStats) {
  for (const r of rows.filter((x) => x.result === 'Warning')) {
    lines.push([r.id, mod.name, r.category, r.objective, r.actual].map(field).join(','))
  }
}

lines.push('')
lines.push('---- รายการ Not Tested (ต้องทำต่อ) ----,,,,,,,,,,,,')
lines.push('ฟังก์ชัน,จำนวน,ไฟล์ CSV,URL')
lines.push('')
for (const { mod, summary } of moduleStats) {
  const nt = Number(summary?.['Not Tested']) || 0
  if (nt > 0) lines.push([mod.name, nt, `testcases/csv/${mod.csv}`, mod.url].map(field).join(','))
}

lines.push('')
lines.push('---- คำสั่งที่ใช้ ----,,,,,,,,,,,,')
lines.push('organize:,node scripts/organize-test-files.js,,,,,,,,,,,,')
lines.push('run all tests:,node scripts/run-all-module-tests.js,,,,,,,,,,,,')
lines.push('build all csv:,node scripts/build-all-module-csvs.js,,,,,,,,,,,,')
lines.push('dashboard:,npm run dashboard,,,,,,,,,,,,')
lines.push('full pipeline:,npm run test:all,,,,,,,,,,,,')

fs.writeFileSync(DASHBOARD_CSV, lines.join('\n') + '\n', 'utf8')
console.log('✅ Dashboard:', DASHBOARD_CSV)
console.log(`   ${grand.modules} modules | ${grand.total} cases | Pass ${grand.pass} | Fail ${grand.fail} | NT ${grand.notTested} | ${grandRate}%`)
