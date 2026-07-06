/**
 * สร้าง CSV ทุกโมดูล — ใช้ generic results เป็นหลัก
 */
const fs = require('fs')
const path = require('path')
const { MODULES } = require('./modules-config')
const { buildModuleCsv } = require('./lib/module-csv-builder')
const { ensureDirs, resultsFile, csvFile } = require('./lib/paths')

function main() {
  ensureDirs()
  console.log(`\n📄 Build CSV for ${MODULES.length} modules\n`)

  let totalNT = 0
  for (const mod of MODULES) {
    const hasGeneric = fs.existsSync(resultsFile(mod.id))
    const { out, sum, passRate, total } = buildModuleCsv(mod)
    totalNT += sum['Not Tested'] || 0
    console.log(`[${mod.id}] ${path.basename(out)} — ${total} cases | P:${sum.Pass} F:${sum.Fail} W:${sum.Warning} NT:${sum['Not Tested']} (${passRate}%) ${hasGeneric ? '' : '(no results)'}`)
  }

  console.log(`\n✅ All CSVs built | Total Not Tested: ${totalNT}`)
}

main()
