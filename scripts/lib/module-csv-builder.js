/**
 * Build CSV from test templates + results JSON
 */
const fs = require('fs')
const { buildTestCases } = require('./test-templates')
const { csvFile, resultsFile } = require('./paths')

function field(s) {
  if (s == null) return ''
  s = String(s)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function buildModuleCsv(mod) {
  const rows = buildTestCases(mod)
  let results = {}
  const resPath = resultsFile(mod.id)
  if (fs.existsSync(resPath)) {
    try { results = JSON.parse(fs.readFileSync(resPath, 'utf8')) } catch {}
  }

  const today = new Date().toISOString().slice(0, 10)
  const blank = ',,,,,,,'
  const sectionRow = (text) => `${field(text)},,,,,,,`
  const sum = { Pass: 0, Fail: 0, Warning: 0, 'Not Tested': 0 }
  const lines = [
    `Project Name :,JIB-Ecommerce,,,Create Date :,${today},,`,
    `Project ID :,,,,Start Test Date :,${today},,`,
    `Tester Name :,sirun.sun@codelabdev.co,,,Finish Test Date :,${today},,`,
    `Project Release / Version :,1.0,,,Module / Function :,${field(mod.name)},,`,
    `URL List :,${mod.url},,,,,,`,
    mod.createUrl ? `URL Create :,${mod.createUrl},,,,,,` : `URL Create :,-,,,,,,`,
    blank,
    `Test Case ID,Category,Test case Objective,Test Description / Procedure,Test Data,Expected Result,Actual Result,Result (Pass/Fail)`,
    blank,
  ]

  for (const row of rows) {
    if (row.type === 'part') { lines.push(sectionRow(`---- ${row.text} ----`)); lines.push(blank); continue }
    if (row.type === 'sub') { lines.push(sectionRow(`-- ${row.text} --`)); continue }
    const r = results[row.id] || {}
    const actual = r.actual || 'ยังไม่ได้รัน automated test'
    const result = r.result || 'Not Tested'
    sum[result] = (sum[result] || 0) + 1
    lines.push([row.id, row.cat, row.obj, row.desc, row.data, row.exp, actual, result].map(field).join(','))
  }

  const total = rows.filter((r) => r.id).length
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
  const noteParts = [`Automated via Puppeteer — ${mod.group} / ${mod.sidebar}`]
  if (mod.businessContext) noteParts.push(`BA: ${mod.businessContext}`)
  lines.push(`Notes :,${field(noteParts.join(' | '))},,,,,,`)

  const out = csvFile(mod.csvName)
  fs.writeFileSync(out, lines.join('\n') + '\n', 'utf8')
  return { out, sum, total, passRate }
}

module.exports = { buildModuleCsv }
