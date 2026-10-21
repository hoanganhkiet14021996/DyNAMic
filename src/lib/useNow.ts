import { useEffect, useState } from 'react'

/** Giờ hiện tại, tự cập nhật mỗi phút (để "còn 18 phút", câu chào... luôn đúng mà không gọi Date trong lúc render). */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date())
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return now
}
