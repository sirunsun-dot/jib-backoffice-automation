const fs = require('fs')
const path = require('path')

const baseName = process.argv[2]
if (!baseName) {
  console.error('Usage: node generate-manual-pdf.js <md-filename-without-path>')
  console.error('Example: node generate-manual-pdf.js โปรโมชั่น-คู่มือผู้ใช้.md')
  process.exit(1)
}

const docsDir = path.join(__dirname, '../docs')
const mdFile = path.join(docsDir, baseName)
const pdfFile = mdFile.replace(/\.md$/i, '.pdf')
const cssFile = path.join(docsDir, 'manual-pdf.css')

function resolveImagePaths(html, baseDir) {
  return html.replace(
    /src="images\/([^"]+)"/g,
    (_, img) => `src="file://${path.join(baseDir, 'images', img)}"`
  )
}

async function main() {
  const { marked } = await import('marked')
  const puppeteer = await import('puppeteer')

  if (!fs.existsSync(mdFile)) {
    console.error('Markdown not found:', mdFile)
    process.exit(1)
  }

  const md = fs.readFileSync(mdFile, 'utf8')
  const css = fs.readFileSync(cssFile, 'utf8')
  let bodyHtml = marked.parse(md)
  bodyHtml = resolveImagePaths(bodyHtml, docsDir)

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>${path.basename(baseName, '.md')}</title>
  <style>${css}</style>
</head>
<body>${bodyHtml}</body>
</html>`

  const tmpHtml = path.join(docsDir, '.manual-temp.html')
  fs.writeFileSync(tmpHtml, html, 'utf8')

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.goto(`file://${tmpHtml}`, { waitUntil: 'networkidle0', timeout: 60000 })
    await page.pdf({
      path: pdfFile,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '15mm', bottom: '18mm', left: '15mm' },
    })
    console.log('PDF created:', pdfFile)
  } finally {
    await browser.close()
    fs.unlinkSync(tmpHtml)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
