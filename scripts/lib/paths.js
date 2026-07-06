/**
 * Centralized paths for test artifacts
 */
const path = require('path')

const ROOT = path.join(__dirname, '../..')
const CSV_DIR = path.join(ROOT, 'testcases/csv')
const RESULTS_DIR = path.join(ROOT, 'testcases/results')
const DASHBOARD_CSV = path.join(ROOT, 'JIB_TestStatus_Dashboard.csv')
const LIVE_JSON = path.join(ROOT, 'testcases/results/live-verify-results.json')

function csvFile(csvName) {
  return path.join(CSV_DIR, `JIB_TestCases_${csvName}_Full.csv`)
}

function resultsFile(moduleId) {
  return path.join(RESULTS_DIR, `${moduleId.toLowerCase()}-test-results.json`)
}

function ensureDirs() {
  const fs = require('fs')
  fs.mkdirSync(CSV_DIR, { recursive: true })
  fs.mkdirSync(RESULTS_DIR, { recursive: true })
}

module.exports = { ROOT, CSV_DIR, RESULTS_DIR, DASHBOARD_CSV, LIVE_JSON, csvFile, resultsFile, ensureDirs }
