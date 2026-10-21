import { createClient } from '@supabase/supabase-js'
import { demoSession } from './demoSession'

// Project Supabase dùng chung với NAMONEY (Web app1) và NomNam (Web app2) — xem .env
const demo = import.meta.env.VITE_DEMO === '1'
const url = demo ? 'https://demo.supabase.co' : (import.meta.env.VITE_SUPABASE_URL as string | undefined)
const key = demo ? 'demo' : (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)

export const cloudConfigured = Boolean(url && key)

// Ghi phiên giả vào storage TRƯỚC khi client đọc lần đầu
if (demo) localStorage.setItem('sb-demo-auth-token', JSON.stringify(demoSession))

/** Chỉ đăng nhập bằng mật khẩu (PIN), nên không bao giờ có token trên URL (app dùng HashRouter). */
export const supabase = createClient(url || 'http://localhost', key || 'missing', {
  auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
  // Chế độ demo (`npm run demo`): dữ liệu mẫu trong bộ nhớ. Nhánh này bị loại khỏi bản build thật.
  ...(demo && {
    global: { fetch: (i: RequestInfo | URL, o?: RequestInit) => import('./demoBackend').then((m) => m.demoFetch(i, o)) },
  }),
})
