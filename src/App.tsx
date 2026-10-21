import { useQuery } from '@tanstack/react-query'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { LoginPage } from './auth/LoginPage'
import type { ReactNode } from 'react'
import { Layout } from './components/Layout'
import { ensureDefaults } from './lib/api'
import { cloudConfigured } from './lib/supabase'
import { DonePage, InboxPage } from './pages/ListPages'
import { ProjectsPage } from './pages/ProjectsPage'
import { TodayPage } from './pages/TodayPage'
import { UpcomingPage } from './pages/UpcomingPage'
import { AreaPage, ProjectPage } from './pages/ProjectPages'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  const { session, loading } = useAuth()

  if (!cloudConfigured)
    return (
      <Notice title="Chưa cấu hình Supabase">
        File <code>.env</code> cần có <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
      </Notice>
    )
  if (loading) return null
  if (!session) return <LoginPage />
  return <SignedIn userId={session.user.id} />
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md p-6 text-sm">
      <h1 className="mb-2 font-serif text-lg">{title}</h1>
      <p className="text-body">{children}</p>
    </div>
  )
}

function SignedIn({ userId }: { userId: string }) {
  const boot = useQuery({
    queryKey: ['bootstrap', userId],
    queryFn: async () => {
      await ensureDefaults(userId)
      return true
    },
    staleTime: Infinity,
    retry: 1,
  })

  if (boot.isPending) return null
  if (boot.isError)
    return (
      <Notice title="Không tải được dữ liệu">
        {/relation|schema cache|does not exist/i.test(boot.error.message)
          ? 'Chưa có bảng dyn_* trên Supabase. Mở Supabase > SQL Editor, dán phần DyNAMic trong file "D:/AI Work/supabase_schema.sql" rồi bấm Run.'
          : boot.error.message}{' '}
        <button className="text-teal underline" onClick={() => boot.refetch()}>
          Thử lại
        </button>
      </Notice>
    )

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/today" element={<TodayPage />} />
          <Route path="/upcoming" element={<UpcomingPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/done" element={<DonePage />} />
          <Route path="/area/:id" element={<AreaPage />} />
          <Route path="/project/:id" element={<ProjectPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
