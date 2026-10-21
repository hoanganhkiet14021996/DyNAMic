import { useSearchParams } from 'react-router-dom'

/** Mở / đóng trình sửa task qua query ?task=<id> (giữ nguyên trang hiện tại). */
export function useOpenTask() {
  const [params, setParams] = useSearchParams()
  return (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('task', id)
    else next.delete('task')
    setParams(next)
  }
}
