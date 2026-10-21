import { useEffect, useState } from 'react'

// TẠM THỜI: chẩn đoán lỗi "không chạm được ô nhập" khi mở từ màn hình chính iPhone.
// Chỉ hiện ở chế độ app (standalone). Xóa file này khi đã tìm ra nguyên nhân.
const BUILD = 'b7'

function describe(el: Element | null) {
  if (!el) return '∅'
  const cls = typeof el.className === 'string' ? el.className.split(' ').slice(0, 2).join('.') : ''
  const name = el.getAttribute('name') ?? el.getAttribute('placeholder') ?? ''
  return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${name ? `[${name}]` : ''}`
}

export function TapDebug() {
  const standalone =
    matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
  const [lines, setLines] = useState<string[]>([])
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!standalone) return
    const log = (s: string) => setLines((l) => [s, ...l].slice(0, 6))
    const onTouch = (e: TouchEvent) => {
      setCount((c) => c + 1)
      const t = e.touches[0] ?? e.changedTouches[0]
      if (!t) return
      const stack = document.elementsFromPoint(t.clientX, t.clientY).slice(0, 3).map(describe).join(' > ')
      log(`${e.type} ${Math.round(t.clientX)},${Math.round(t.clientY)} → ${stack}`)
    }
    const onFocus = (e: FocusEvent) => log(`focus → ${describe(e.target as Element)}`)
    const onBlur = (e: FocusEvent) => log(`blur ← ${describe(e.target as Element)}`)
    document.addEventListener('touchstart', onTouch, { capture: true, passive: true })
    document.addEventListener('touchend', onTouch, { capture: true, passive: true })
    document.addEventListener('focusin', onFocus, true)
    document.addEventListener('focusout', onBlur, true)
    return () => {
      document.removeEventListener('focusout', onBlur, true)
      document.removeEventListener('touchstart', onTouch, true)
      document.removeEventListener('touchend', onTouch, true)
      document.removeEventListener('focusin', onFocus, true)
    }
  }, [standalone])

  if (!standalone) return null
  const vv = window.visualViewport
  return (
    <div className="mt-6 rounded-lg border border-rule2 p-2 font-mono text-[10px] leading-snug text-cap">
      <div>
        {BUILD} · chạm {count} · win {window.innerWidth}×{window.innerHeight} · vv {Math.round(vv?.height ?? 0)} top{' '}
        {Math.round(vv?.offsetTop ?? 0)} · {navigator.userAgent.match(/OS [\d_]+/)?.[0]}
      </div>
      <input className="input my-2 font-sans text-sm" placeholder="Ô thử (không tự điền)" autoComplete="off" />
      <textarea className="input mb-2 font-sans text-sm" rows={1} placeholder="Ô thử 2 (textarea)" />
      {lines.map((l, i) => (
        <div key={i} className="break-all">
          {l}
        </div>
      ))}
    </div>
  )
}
