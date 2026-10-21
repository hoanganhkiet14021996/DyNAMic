import type { ReactNode } from 'react'
import { Drawer } from 'vaul'
import { cn } from '../../lib/tasks'

/** Bảng trượt từ dưới lên (vuốt xuống để đóng). Dùng cho "Thêm việc" và "Chi tiết việc". */
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50" style={{ background: 'var(--overlay)' }} />
        <Drawer.Content
          aria-describedby={undefined}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-2xl border border-b-0 border-rule2 bg-canvas outline-none',
            className,
          )}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-rule2" />
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <div className="overflow-y-auto px-[18px] pt-4 pb-[max(env(safe-area-inset-bottom),1.25rem)]">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
