/**
 * ดึงรายการเมนูทั้งหมดจาก Sidebar — expand ทุก section ก่อน
 */
const fs = require('fs')
const path = require('path')
const { launchAndLogin, sleep } = require('./_helpers')

const OUT = path.join(__dirname, 'sidebar-menu.json')
const BASE = 'https://devstorex.jibc.codelabdev.co'

async function main() {
  const { browser, page } = await launchAndLogin()
  await page.goto(`${BASE}/store/product-manager/products`, { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(3000)

  // dump sidebar structure for debug
  const structure = await page.evaluate(() => {
    const nav = document.querySelector('nav') || document.querySelector('aside')
    if (!nav) return { error: 'no nav/aside', bodySnippet: document.body.innerText.slice(0, 2000) }

    const walk = (el, depth = 0) => {
      if (!el || depth > 12) return null
      const tag = el.tagName?.toLowerCase()
      const text = (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3)
        ? el.textContent.trim().slice(0, 60) : ''
      const directText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join(' ')
        .slice(0, 60)
      const href = el.getAttribute?.('href')
      const role = el.getAttribute?.('role')
      const children = Array.from(el.children || [])
        .filter((c) => c.offsetParent !== null || c.tagName === 'A')
        .map((c) => walk(c, depth + 1))
        .filter(Boolean)
      if (!text && !directText && !href && children.length === 0) return null
      return { tag, text: directText || text, href, role, children: children.length ? children : undefined }
    }
    return { tree: walk(nav), innerText: nav.innerText }
  })

  // click every collapsible in sidebar to expand
  for (let round = 0; round < 5; round++) {
    const clicked = await page.evaluate(() => {
      const nav = document.querySelector('nav') || document.querySelector('aside') || document.body
      let n = 0
      nav.querySelectorAll('button, [data-state="closed"], [aria-expanded="false"]').forEach((el) => {
        if (el.offsetParent !== null) { try { el.click(); n++ } catch {} }
      })
      return n
    })
    if (!clicked) break
    await sleep(800)
  }

  // get full sidebar text after expand
  const sidebarText = await page.evaluate(() => {
    const nav = document.querySelector('nav') || document.querySelector('aside')
    return nav ? nav.innerText : document.body.innerText
  })

  const lines = sidebarText.split('\n').map((l) => l.trim()).filter(Boolean)
  console.log('Sidebar lines:', lines.length)
  console.log(lines.join('\n'))

  // collect ALL internal links on page (sidebar + anywhere)
  const allLinks = await page.evaluate((base) => {
    const seen = new Set()
    const items = []
    document.querySelectorAll('a[href]').forEach((a) => {
      let href = a.getAttribute('href') || ''
      if (!href || href === '#' || href.startsWith('mailto:')) return
      if (!href.startsWith('http')) href = base + (href.startsWith('/') ? href : '/' + href)
      if (!href.includes('devstorex.jibc.codelabdev.co')) return
      if (href.includes('/auth/')) return
      const text = (a.textContent || '').replace(/\s+/g, ' ').trim()
      if (!text) return
      const key = href
      if (seen.has(key)) return
      seen.add(key)
      // check if in sidebar
      const inNav = !!(a.closest('nav') || a.closest('aside') || a.closest('[class*="sidebar" i]'))
      items.push({ text, href: href.replace(base, ''), full: href, inSidebar: inNav })
    })
    return items.sort((a, b) => a.href.localeCompare(b.href))
  }, BASE)

  const sidebarLinks = allLinks.filter((l) => l.inSidebar)
  const otherLinks = allLinks.filter((l) => !l.inSidebar)

  console.log('\n=== SIDEBAR LINKS (' + sidebarLinks.length + ') ===')
  sidebarLinks.forEach((l) => console.log(l.href.padEnd(55), l.text))

  // also visit main page and permission manager to get more menus
  const extraPages = [
    `${BASE}/permission-manager/permissions`,
    `${BASE}/store/promotion-manager/promotions`,
    `${BASE}/main`,
  ]
  const allItems = [...sidebarLinks]

  for (const url of extraPages) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await sleep(2000)
    for (let round = 0; round < 5; round++) {
      await page.evaluate(() => {
        document.querySelectorAll('nav button, aside button, [aria-expanded="false"]').forEach((el) => {
          if (el.offsetParent !== null) try { el.click() } catch {}
        })
      })
      await sleep(500)
    }
    const links = await page.evaluate((base) => {
      const seen = new Set()
      const items = []
      document.querySelectorAll('nav a[href], aside a[href]').forEach((a) => {
        let href = a.getAttribute('href') || ''
        if (!href.startsWith('/')) return
        const text = (a.textContent || '').replace(/\s+/g, ' ').trim()
        if (!text || seen.has(href)) return
        seen.add(href)
        items.push({ text, href, full: base + href, inSidebar: true })
      })
      return items
    }, BASE)
    for (const l of links) {
      if (!allItems.find((x) => x.href === l.href)) allItems.push(l)
    }
  }

  allItems.sort((a, b) => a.href.localeCompare(b.href))

  console.log('\n=== MERGED SIDEBAR LINKS (' + allItems.length + ') ===')
  allItems.forEach((l) => console.log(l.href.padEnd(55), l.text))

  const result = {
    discoveredAt: new Date().toISOString(),
    sidebarTextLines: lines,
    total: allItems.length,
    items: allItems,
    structure,
  }
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8')
  console.log('\nSaved:', OUT)
  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
