const fs = require('fs')
const path = require('path')

const specFolder = process.argv[2]
const imageFolder = process.argv[3]

if (!specFolder || !imageFolder) {
  console.error('Usage: node copy-manual-screenshots.js <cypress-subfolder> <docs-image-folder>')
  process.exit(1)
}

const src = path.join(
  __dirname,
  `../cypress/screenshots/${specFolder}`
)
const dest = path.join(__dirname, `../docs/images/${imageFolder}`)

if (!fs.existsSync(src)) {
  console.error('No screenshots found at:', src)
  process.exit(1)
}

fs.mkdirSync(dest, { recursive: true })
for (const file of fs.readdirSync(src)) {
  if (file.endsWith('.png')) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file))
  }
}
console.log(`Copied screenshots to ${dest}`)
