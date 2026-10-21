import { Check } from 'lucide-react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useRef, useState, type ReactNode } from 'react'

const OPEN_X = -156 // độ rộng khay nút bên phải
const COMPLETE_AT = 72 // vuốt phải quá mức này thì hoàn thành

/**
 * Vuốt phải = Xong. Vuốt trái = mở khay nút (Dời / Xóa).
 * Vuốt chỉ là phím tắt: mọi thao tác đều có nút tương đương trong bảng chi tiết việc.
 */
export function SwipeRow({
  children,
  disabled,
  onComplete,
  onTap,
  actions,
}: {
  children: ReactNode
  disabled?: boolean
  onComplete: () => void
  onTap: () => void
  actions: (close: () => void) => ReactNode
}) {
  const x = useMotionValue(0)
  const doneOpacity = useTransform(x, [0, 56], [0, 1])
  const trayOpacity = useTransform(x, [0, -28], [0, 1])
  const [open, setOpen] = useState(false)
  const dragged = useRef(false)

  const settle = (target: number) => {
    animate(x, target, { type: 'spring', stiffness: 520, damping: 42 })
    setOpen(target !== 0)
  }

  if (disabled) return <div onClick={onTap}>{children}</div>

  return (
    <div className="relative overflow-hidden">
      <motion.div
        aria-hidden
        style={{ opacity: doneOpacity }}
        className="absolute inset-y-0 left-0 flex w-32 items-center bg-forest pl-6 text-canvas"
      >
        <Check size={22} strokeWidth={3} />
      </motion.div>
      <motion.div style={{ opacity: trayOpacity }} className="absolute inset-y-0 right-0 flex" inert={!open}>
        {actions(() => settle(0))}
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: OPEN_X, right: 120 }}
        dragElastic={0.08}
        style={{ x }}
        className="relative bg-canvas"
        onDragStart={() => {
          dragged.current = true
        }}
        onDragEnd={() => {
          const v = x.get()
          if (v > COMPLETE_AT) {
            onComplete()
            settle(0)
          } else if (v < -COMPLETE_AT * 0.8) settle(OPEN_X)
          else settle(0)
          // click sinh ra ngay sau khi thả tay phải bị bỏ qua
          setTimeout(() => {
            dragged.current = false
          }, 0)
        }}
        onClick={() => {
          if (dragged.current) return
          if (open) settle(0)
          else onTap()
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
