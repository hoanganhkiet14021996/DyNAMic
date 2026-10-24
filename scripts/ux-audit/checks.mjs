// Kiểm tra tĩnh một trang: font, cỡ chữ, vùng chạm, tương phản, nhãn truy cập, tràn ngang.
// Hàm `scan` chạy TRONG trình duyệt (page.evaluate) nên phải tự đứng một mình, không import gì.

export function scan() {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  ctx.canvas.width = ctx.canvas.height = 1
  // Đổi mọi định dạng màu (oklch, color-mix...) về rgba bằng canvas
  const rgba = (c) => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = c
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return [r, g, b, a / 255]
  }
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const bgOf = (el) => {
    const layers = []
    for (let e = el; e; e = e.parentElement) {
      const c = rgba(getComputedStyle(e).backgroundColor)
      if (c[3] > 0) layers.push(c)
      if (c[3] >= 1) break
    }
    // trộn từ dưới lên
    let base = [255, 255, 255]
    for (const l of layers.reverse()) base = base.map((v, i) => v * (1 - l[3]) + l[i] * l[3])
    return base
  }
  const short = (el) => {
    const t = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 28)
    return `<${el.tagName.toLowerCase()}>${t ? ' “' + t + '”' : ''}`
  }
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'
  }

  const fonts = {} // "Fraunces 400 24px" -> số phần tử
  const sizes = {}
  const issues = []
  const push = (type, el, detail) => issues.push({ type, el: short(el), detail })

  for (const el of document.body.querySelectorAll('*')) {
    if (!visible(el)) continue
    const s = getComputedStyle(el)
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (ownText) {
      const fam = s.fontFamily.split(',')[0].replace(/["']/g, '').trim()
      const px = parseFloat(s.fontSize)
      fonts[fam] = (fonts[fam] || 0) + 1
      sizes[px] = (sizes[px] || 0) + 1
      if (px < 12) push('chữ-nhỏ', el, `${px}px`)

      // tương phản
      const fg = rgba(s.color)
      const bg = bgOf(el)
      const fgMix = fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]))
      const [l1, l2] = [lum(fgMix), lum(bg)].sort((a, b) => b - a)
      const ratio = (l1 + 0.05) / (l2 + 0.05)
      const large = px >= 24 || (px >= 18.66 && parseInt(s.fontWeight) >= 700)
      if (ratio < (large ? 3 : 4.5)) push('tương-phản', el, `${ratio.toFixed(2)}:1 (${px}px)`)
    }
    if (el.matches('input,textarea,select') && el.type !== 'range' && el.type !== 'hidden') {
      const px = parseFloat(s.fontSize)
      if (px < 16) push('ô-nhập<16px(iOS zoom)', el, `${px}px`)
      const named = el.getAttribute('aria-label') || el.labels?.length || el.closest('label')
      if (!named) push('thiếu-nhãn', el, 'ô nhập không có nhãn')
    }
    if (el.matches('button,a[href],[role=button],input[type=checkbox]')) {
      const r = el.getBoundingClientRect()
      if (r.width < 44 || r.height < 44) push('vùng-chạm<44px', el, `${Math.round(r.width)}×${Math.round(r.height)}`)
      const name = (el.getAttribute('aria-label') || el.innerText || el.title || '').trim()
      if (!name) push('nút-không-tên', el, 'nút chỉ có icon, thiếu aria-label')
    }
  }
  const de = document.documentElement
  if (de.scrollWidth > de.clientWidth + 1) issues.push({ type: 'cuộn-ngang', el: 'trang', detail: `${de.scrollWidth}>${de.clientWidth}` })

  // nội dung cuối trang bị thanh dưới che?
  const nav = document.querySelector('nav')
  let navCovers = null
  if (nav && visible(nav)) {
    const pb = parseFloat(getComputedStyle(document.querySelector('main') || document.body).paddingBottom)
    navCovers = { navHeight: Math.round(nav.getBoundingClientRect().height), mainPaddingBottom: Math.round(pb) }
    if (pb < nav.getBoundingClientRect().height - 4) issues.push({ type: 'thanh-dưới-che-nội-dung', el: 'main', detail: JSON.stringify(navCovers) })
  }

  return {
    fonts,
    sizes,
    loadedFonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight} ${f.style}`),
    issues,
    title: document.title,
    lang: de.lang,
    zoomBlocked: /user-scalable=no|maximum-scale=1(\.0)?(?!\d)/.test(document.querySelector('meta[name=viewport]')?.content || ''),
    h1: document.querySelectorAll('h1').length,
  }
}
