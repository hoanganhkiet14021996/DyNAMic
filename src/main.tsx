import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/inter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        {/* Toast ở trên cùng để không đè thanh dưới; nút Hoàn tác dùng chung cho mọi thao tác */}
        <Toaster
          position="top-center"
          offset={{ top: 'max(env(safe-area-inset-top), 12px)' }}
          toastOptions={{
            style: {
              background: 'var(--canvas)',
              color: 'var(--ink)',
              border: '1px solid var(--rule2)',
              borderRadius: '10px',
              fontFamily: 'inherit',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
