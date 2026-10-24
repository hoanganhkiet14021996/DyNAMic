// Kiểm tra UI/UX DyNAMic: `npm run audit`
// 1) Quét tĩnh từng trang (sáng + tối): font, cỡ chữ, vùng chạm, tương phản, nhãn truy cập.
// 2) 3 người dùng ảo dùng thử app ở chế độ demo (mục tiêu cố định + hành động ngẫu nhiên có hạt giống).
// Kết quả: scripts/ux-audit/out/report.md, report.json, screens/*.png
// Chạy lại ra kết quả khác: `npm run audit -- --seed=7`

import { spawn, execSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, devices } from 'playwright-core'
import { scan } from './checks.mjs'
import { personas, randomActions, rng } from './personas.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const out = join(here, 'out')
const PORT = 5191
const BASE = `http://localhost:${PORT}/#`
const seedShift = Number((process.argv.find((a) => a.startsWith('--seed=')) ?? '--seed=0').split('=')[1])
const PAGES = ['/today', '/upcoming', '/projects', '/inbox', '/done', '/settings']
const RANDOM_STEPS = 25

rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'screens'), { recursive: true })

// ---------- bật server demo ----------
const server = spawn('npx', ['vite', '--mode', 'demo', '--port', String(PORT), '--strictPort'], { cwd: root, shell: true, stdio: 'ignore' })
const stopServer = () => {
  try {
    if (process.platform === 'win32') execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' })
    else server.kill()
  } catch {}
}
process.on('exit', stopServer)
for (let i = 0; ; i++) {
  try {
    if ((await fetch(`http://localhost:${PORT}/`)).ok) break
  } catch {}
  if (i > 60) throw new Error('Server demo không lên được sau 30 giây')
  await new Promise((r) => setTimeout(r, 500))
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const iphone = { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function newPage(theme, extra = {}) {
  const ctx = await browser.newContext({ ...iphone, colorScheme: theme, locale: 'vi-VN', ...extra })
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem('theme', t)
    } catch {}
  }, theme)
  const page = await ctx.newPage()
  const logs = []
  page.on('console', (m) => m.type() === 'error' && logs.push(`console: ${m.text().slice(0, 160)}`))
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message.slice(0, 160)}`))
  return { ctx, page, logs }
}

// ---------- 1. quét tĩnh ----------
const staticResults = []
for (const theme of ['light', 'dark']) {
  const { ctx, page } = await newPage(theme)
  await page.goto(`${BASE}/today`)
  await page.waitForSelector('nav', { timeout: 15000 })
  for (const p of PAGES) {
    await page.evaluate((h) => (location.hash = h), p)
    await sleep(900)
    await page.evaluate(() => document.fonts.ready)
    const res = await page.evaluate(scan)
    staticResults.push({ page: p, theme, ...res })
    await page.screenshot({ path: join(out, 'screens', `${p.slice(1)}-${theme}.png`) })
  }
  // bảng Thêm việc + chi tiết việc (các bảng trượt cũng cần quét)
  await page.evaluate(() => (location.hash = '/today'))
  await sleep(500)
  await page.locator('nav button[aria-label="Thêm việc"]').click()
  await sleep(800)
  staticResults.push({ page: '[bảng Thêm việc]', theme, ...(await page.evaluate(scan)) })
  await page.screenshot({ path: join(out, 'screens', `sheet-add-${theme}.png`) })
  await page.keyboard.press('Escape')
  await sleep(600)
  await ctx.close()
}

// ---------- 2. người dùng ảo ----------
function helpers(page, state) {
  const h = {
    page,
    tap: (n = 1) => (state.taps += n),
    async goTab(label) {
      await page.getByRole('link', { name: label, exact: true }).first().click({ timeout: 3000 })
      h.tap()
      await sleep(350)
    },
    async closeSheet() {
      await page.keyboard.press('Escape')
      await sleep(450)
    },
    async addTask(text, due) {
      await page.locator('nav button[aria-label="Thêm việc"]').click({ timeout: 3000 })
      h.tap()
      const box = page.getByLabel('Việc cần làm')
      await box.fill(text, { timeout: 3000 })
      h.tap()
      if (due) {
        const chip = page.getByRole('button', { name: due, exact: true })
        // chip đã được chọn sẵn theo trang đang xem → người dùng không cần bấm (bấm sẽ bỏ chọn)
        if ((await chip.getAttribute('aria-pressed', { timeout: 3000 })) !== 'true') {
          await chip.click({ timeout: 3000 })
          h.tap()
        }
      }
      await box.press('Enter')
      h.tap()
      const toast = page.getByText(/Đã thêm/).first()
      await toast.waitFor({ timeout: 3000 })
      state.toasts.push(await page.locator('[data-sonner-toast]').first().innerText().catch(() => ''))
      await h.closeSheet()
    },
    async rowBox() {
      // không có việc nào trên màn hình → người dùng sẽ quay về Hôm nay, thêm một việc rồi mới thao tác
      if (!(await page.getByRole('button', { name: 'Hoàn thành', exact: true }).count())) {
        await h.goTab('Hôm nay')
        await sleep(600)
        if (!(await page.getByRole('button', { name: 'Hoàn thành', exact: true }).count())) await h.addTask('Việc mẫu cho thao tác', 'Hôm nay')
      }
      const b = page.getByRole('button', { name: 'Hoàn thành', exact: true }).first()
      await b.waitFor({ timeout: 2500 })
      const r = await b.boundingBox()
      return { x: r.x, y: r.y + r.height / 2 }
    },
    async completeFirst() {
      await page.getByRole('button', { name: 'Hoàn thành', exact: true }).first().click({ timeout: 2500 })
      h.tap()
      await sleep(400)
    },
    async openFirstTask() {
      const { x, y } = await h.rowBox()
      await page.mouse.click(x + 140, y)
      h.tap()
      await page.getByLabel('Tên việc').waitFor({ timeout: 2500 })
    },
    async swipeFirst(dir) {
      const { x, y } = await h.rowBox()
      const start = x + 150
      await page.mouse.move(start, y)
      await page.mouse.down()
      const end = dir === 'right' ? start + 170 : start - 140
      for (let i = 1; i <= 8; i++) await page.mouse.move(start + ((end - start) * i) / 8, y)
      await page.mouse.up()
      h.tap()
      await sleep(500)
      if (dir === 'left-move') {
        await page.getByRole('button', { name: 'Ngày mai', exact: true }).first().click({ timeout: 2000 })
        h.tap()
        await sleep(400)
      }
    },
    async addSubtask(text) {
      const input = page.getByLabel('Thêm subtask')
      await input.fill(text, { timeout: 2500 })
      await input.press('Enter')
      h.tap(2)
      await sleep(300)
    },
    async findViaSearch(text) {
      await h.goTab('Dự án')
      const words = text.replace(/[!#]\S+/g, '').trim().split(/\s+/).slice(0, 2).join(' ')
      await page.getByLabel('Tìm việc').fill(words, { timeout: 2500 })
      h.tap()
      await sleep(400)
      const ok = await page.locator('main').getByText(words.split(' ')[0], { exact: false }).first().waitFor({ timeout: 1500 }).then(() => true, () => false)
      await page.getByLabel('Tìm việc').fill('')
      return ok
    },
  }
  return h
}

// chữ hiển thị + nhãn truy cập / placeholder (để đối chiếu nhu cầu)
const pageText = (page) =>
  page.evaluate(
    () => document.body.innerText + ' ' + [...document.querySelectorAll('[aria-label],[placeholder]')].map((e) => e.getAttribute('aria-label') || e.getAttribute('placeholder')).join(' '),
  )

const noAccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')

const personaResults = []
for (const p of personas) {
  const { ctx, page, logs } = await newPage(p.theme)
  const state = { taps: 0, toasts: [] }
  const h = helpers(page, state)
  const rand = rng(p.seed + seedShift)
  const goalRes = []
  const randRes = []
  const corpus = []

  await page.goto(`${BASE}/today`)
  await page.waitForSelector('nav', { timeout: 15000 })
  await sleep(800)
  corpus.push(await pageText(page))

  // mục tiêu cố định: thêm việc rồi thử tìm lại nó
  for (const g of p.goals) {
    const t0 = Date.now()
    const before = state.taps
    const r = { goal: g.label, ok: true, error: '' }
    try {
      await h.goTab('Hôm nay')
      await h.addTask(g.text, g.due)
      r.found = await h.findViaSearch(noAccent(g.text) === g.text ? g.text : p.typesNoAccent ? noAccent(g.text) : g.text)
      if (!r.found) throw new Error('thêm xong nhưng tìm lại không thấy')
      if (g.subtasks) {
        await page.getByLabel('Tìm việc').fill(g.text.split(' ')[0] + ' ' + g.text.split(' ')[1])
        await sleep(300)
        await page.getByText(g.text.split(' ').slice(0, 2).join(' ')).first().click({ timeout: 2500 })
        h.tap(2)
        await page.getByLabel('Tên việc').waitFor({ timeout: 2500 })
        for (const s of g.subtasks) await h.addSubtask(s)
        await h.closeSheet()
      }
    } catch (e) {
      r.ok = false
      r.error = [e.message.split('\n')[0], ...(e.message.match(/(intercepts pointer events|not visible|outside of the viewport|not stable|element is not enabled)/) || [])].join(' · ').slice(0, 160)
    }
    r.taps = state.taps - before
    r.ms = Date.now() - t0
    goalRes.push(r)
    await page.screenshot({ path: join(out, 'screens', `${p.id}-goal-${goalRes.length}.png`) })
  }

  // hành động ngẫu nhiên
  const names = Object.keys(randomActions)
  for (let i = 0; i < RANDOM_STEPS; i++) {
    const name = names[Math.floor(rand() * names.length)]
    const t0 = Date.now()
    const r = { action: name, ok: true, error: '' }
    try {
      if (await page.getByLabel('Tên việc').isVisible().catch(() => false)) await h.closeSheet()
      await randomActions[name](h, rand)
    } catch (e) {
      r.ok = false
      r.error = [e.message.split('\n')[0], ...(e.message.match(/(intercepts pointer events|not visible|outside of the viewport|not stable|element is not enabled)/) || [])].join(' · ').slice(0, 160)
      await page.screenshot({ path: join(out, 'screens', `fail-${p.id}-${i}.png`) }).catch(() => {})
      await page.keyboard.press('Escape').catch(() => {})
    }
    r.ms = Date.now() - t0
    randRes.push(r)
  }
  await page.screenshot({ path: join(out, 'screens', `${p.id}-end.png`) })

  // gom chữ hiển thị để đối chiếu nhu cầu
  for (const tab of ['Hôm nay', 'Sắp tới', 'Dự án', 'Cài đặt']) {
    try {
      await h.goTab(tab)
      await sleep(400)
      corpus.push(await pageText(page))
    } catch {}
  }
  try {
    await h.goTab('Hôm nay')
    await h.openFirstTask()
    await page.getByRole('button', { name: /Thêm chi tiết/ }).click({ timeout: 2000 })
    await sleep(400)
    corpus.push(await pageText(page))
    await page.screenshot({ path: join(out, 'screens', `${p.id}-task-detail.png`) })
    await h.closeSheet()
  } catch {}
  const text = corpus.join('\n')
  const needs = p.needs.map(([label, re]) => ({ label, has: re.test(text) }))

  personaResults.push({ ...p, goalRes, randRes, needs, taps: state.taps, errors: [...new Set(logs)] })
  await ctx.close()
}

await browser.close()
stopServer()

// ---------- 3. báo cáo ----------
const fontAgg = {}
const sizeAgg = {}
const issueAgg = {}
for (const r of staticResults) {
  for (const [f, n] of Object.entries(r.fonts)) fontAgg[f] = (fontAgg[f] || 0) + n
  for (const [s, n] of Object.entries(r.sizes)) sizeAgg[s] = (sizeAgg[s] || 0) + n
  for (const i of r.issues) {
    const k = i.type
    issueAgg[k] ??= { count: 0, ex: new Map() }
    issueAgg[k].count++
    const key = `${i.el} — ${i.detail}`
    if (!issueAgg[k].ex.has(key)) issueAgg[k].ex.set(key, new Set())
    issueAgg[k].ex.get(key).add(`${r.page} (${r.theme === 'light' ? 'sáng' : 'tối'})`)
  }
}
const loaded = [...new Set(staticResults.flatMap((r) => r.loadedFonts))]
const totalText = Object.values(fontAgg).reduce((a, b) => a + b, 0)

let md = `# Báo cáo kiểm tra UI/UX DyNAMic\n\nChạy lúc ${new Date().toLocaleString('vi-VN')} · iPhone 390×844 · Chrome · chế độ demo · seed ${seedShift}\n\n`
md += `## 1. Font chữ\n\n| Font (đang hiển thị) | Số phần tử chữ | Tỷ lệ |\n|---|---:|---:|\n`
for (const [f, n] of Object.entries(fontAgg).sort((a, b) => b[1] - a[1])) md += `| ${f} | ${n} | ${((n / totalText) * 100).toFixed(0)}% |\n`
md += `\nFont đã tải thật: ${loaded.join(', ') || '(không có)'}\n\n`
md += `**Cỡ chữ (px → số phần tử):** ${Object.entries(sizeAgg).sort((a, b) => a[0] - b[0]).map(([s, n]) => `${s}px×${n}`).join(' · ')}\n\n`
const v = staticResults[0]
md += `Khác: \`lang="${v.lang}"\` · chặn phóng to: ${v.zoomBlocked ? 'CÓ (xấu cho người lớn tuổi)' : 'không'} · số thẻ h1 trang đầu: ${v.h1}\n\n`

md += `## 2. Trở ngại giao diện (quét tự động)\n\n`
if (!Object.keys(issueAgg).length) md += 'Không phát hiện vấn đề.\n\n'
for (const [type, { count, ex }] of Object.entries(issueAgg).sort((a, b) => b[1].count - a[1].count)) {
  md += `### ${type} — ${count} lượt\n`
  for (const [k, pgs] of [...ex].slice(0, 8)) md += `- ${k} · ${[...pgs].slice(0, 4).join(', ')}${pgs.size > 4 ? '…' : ''}\n`
  if (ex.size > 8) md += `- … và ${ex.size - 8} mục khác\n`
  md += '\n'
}

md += `## 3. Người dùng ảo\n\n`
for (const p of personaResults) {
  const okRand = p.randRes.filter((r) => r.ok).length
  md += `### ${p.name}, ${p.age} tuổi — ${p.role} (${p.theme === 'dark' ? 'tối' : 'sáng'})\n_${p.story}_\n\n`
  md += `- Mục tiêu: ${p.goalRes.map((g) => `${g.ok ? '✅' : '❌'} ${g.goal} (${g.taps} thao tác, ${(g.ms / 1000).toFixed(1)}s${g.error ? ' — ' + g.error : ''})`).join('; ')}\n`
  md += `- Hành động ngẫu nhiên: ${okRand}/${p.randRes.length} thành công\n`
  for (const r of p.randRes.filter((r) => !r.ok)) md += `  - ❌ ${r.action}: ${r.error}\n`
  md += `- Lỗi console: ${p.errors.length ? p.errors.join(' | ') : 'không'}\n`
  md += `- Nhu cầu đáp ứng:\n${p.needs.map((n) => `  - ${n.has ? '✅' : '❌ THIẾU'} ${n.label}`).join('\n')}\n\n`
}
writeFileSync(join(out, 'report.md'), md)
writeFileSync(join(out, 'report.json'), JSON.stringify({ staticResults, personaResults }, null, 2))
console.log(md)
console.log(`\nĐã lưu: ${join(out, 'report.md')}`)
