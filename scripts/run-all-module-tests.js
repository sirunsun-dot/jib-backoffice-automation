/**
 * รัน automated tests ทุกโมดูล (browser เดียว, resume ได้)
 * รัน: node scripts/run-all-module-tests.js [--skip-existing] [--only=CAT,BR]
 */
const fs = require('fs')
const path = require('path')
const { launchAndLogin } = require('./_helpers')
const { MODULES } = require('./modules-config')
const { runModuleTests } = require('./lib/module-runner')
const { ensureDirs, resultsFile } = require('./lib/paths')

const args = process.argv.slice(2)
const onlyArg = args.find((a) => a.startsWith('--only='))
const onlyIds = onlyArg ? onlyArg.split('=')[1].split(',') : null
const skipExisting = args.includes('--skip-existing')

function hasResults(mod) {
  return fs.existsSync(resultsFile(mod.id))
}

async function main() {
  ensureDirs()
  let modules = onlyIds ? MODULES.filter((m) => onlyIds.includes(m.id)) : MODULES
  if (skipExisting) modules = modules.filter((m) => !hasResults(m))

  console.log(`\n🚀 Run ${modules.length} modules (skip-existing=${skipExisting})\n`)
  if (!modules.length) { console.log('Nothing to run.'); return }

  const session = await launchAndLogin()
  let done = 0

  for (const mod of modules) {
    done++
    console.log(`\n[${done}/${modules.length}] ${mod.id} — ${mod.name}`)
    try {
      await runModuleTests(mod, session)
    } catch (e) {
      console.error(`  ERROR: ${e.message}`)
    }
  }

  await session.browser.close()
  console.log('\n✅ All module tests done')
}

main().catch((e) => { console.error(e); process.exit(1) })
