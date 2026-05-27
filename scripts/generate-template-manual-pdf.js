#!/usr/bin/env node
require('child_process').execFileSync(
  process.execPath,
  [require('path').join(__dirname, 'generate-manual-pdf.js'), 'เทมเพลตคุณสมบัติ-คู่มือผู้ใช้.md'],
  { stdio: 'inherit' }
)
