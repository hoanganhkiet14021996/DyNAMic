import { useSearchParams } from 'react-router-dom'

/** Mở / đóng bảng "Thêm việc" qua query ?add=1 (giữ nguyên trang đang xem). */
export function useAddSheet() {
  const [params, setParams] = useSearchParams()
  const isOpen = params.get('add') === '1'
  const set = (open: boolean) => {
    const next = new URLSearchParams(params)
    if (open) next.set('add', '1')
    else next.delete('add')
    setParams(next, { replace: !open })
  }
  return { isOpen, open: () => set(true), close: () => set(false) }
}
