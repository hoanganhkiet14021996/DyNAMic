import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '../lib/tasks'

/**
 * Nút cần bấm 2 lần (lần 1 hiện "Bấm lần nữa…", tự hủy sau 3 giây).
 * Thay cho window.confirm() — trên app đã cài vào màn hình chính, confirm() có lúc không hiện.
 */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = 'Bấm lần nữa',
  className = 'btn-danger',
  ariaLabel,
}: {
  onConfirm: () => void
  children: ReactNode
  confirmLabel?: string
  className?: string
  ariaLabel?: string
}) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <button
      type="button"
      aria-label={armed ? confirmLabel : ariaLabel}
      className={cn(className, armed && 'whitespace-nowrap bg-oxblood! text-canvas!')}
      onClick={(e) => {
        e.stopPropagation()
        if (armed) {
          setArmed(false)
          onConfirm()
        } else setArmed(true)
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}
