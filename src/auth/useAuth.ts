import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export const AuthContext = createContext<{ session: Session | null; loading: boolean }>({
  session: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)
