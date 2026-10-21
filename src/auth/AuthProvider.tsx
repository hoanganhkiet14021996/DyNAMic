import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const qc = useQueryClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      // Đăng xuất / đổi tài khoản → bỏ dữ liệu đã tải của người trước
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') qc.clear()
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [qc])

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>
}
