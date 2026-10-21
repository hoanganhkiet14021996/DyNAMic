import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS, type NavItem } from '../lib/nav'
import { cn } from '../lib/tasks'
import { useAddSheet } from '../lib/useSheets'

function Tab({ to, label, icon: Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex flex-1 flex-col items-center gap-0.5 pt-3 pb-1 text-[11.5px] font-medium text-cap',
          isActive && 'font-semibold text-teal',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute -top-px h-0.5 w-7 rounded-full bg-teal" />}
          <Icon size={22} strokeWidth={1.9} />
          {label}
        </>
      )}
    </NavLink>
  )
}

/** Thanh dưới trên điện thoại: 2 tab · nút + · 2 tab. Tab đang chọn = gạch teal phía trên. */
export function BottomNav() {
  const add = useAddSheet()
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-canvas md:hidden">
      <div className="mx-auto flex max-w-lg items-end px-2">
        <Tab {...NAV_ITEMS[0]} />
        <Tab {...NAV_ITEMS[1]} />
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={add.open}
            aria-label="Thêm việc"
            className="-mt-6 mb-1 flex size-[54px] items-center justify-center rounded-[14px] border-4 border-canvas bg-brand text-on-brand box-content transition-transform active:scale-95"
          >
            <Plus size={26} strokeWidth={2.4} />
          </button>
        </div>
        <Tab {...NAV_ITEMS[2]} />
        <Tab {...NAV_ITEMS[3]} />
      </div>
    </nav>
  )
}
