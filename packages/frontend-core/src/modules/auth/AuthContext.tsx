import type { Session } from 'better-auth/types'
import { createContext, use, useEffect, useMemo, useState } from 'react'

interface User {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  emailVerified?: boolean
}

interface AuthContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'eh_auth_user'

/**
 * Provider component for authentication state
 * Fetches and manages session from the backend
 * Uses localStorage for optimistic rendering to avoid flickering
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(() => {
    // Hydrate from localStorage on mount to avoid flickering
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Use AbortController to cancel fetch on unmount (e.g., React StrictMode double-mount)
    const abortController = new AbortController()

    // Fetch session from backend
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          signal: abortController.signal,
        })
        if (response.ok) {
          const data = await response.json()
          setSession(data)
          setUser(data?.user || null)
          if (data?.user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
          } else {
            localStorage.removeItem(STORAGE_KEY)
          }
        } else {
          setSession(null)
          setUser(null)
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch (error) {
        // Ignore abort errors (happens on cleanup)
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        console.error('Failed to fetch session:', error)
        setSession(null)
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()

    // Cleanup: abort fetch on unmount
    return () => {
      abortController.abort()
    }
  }, [])

  const value: AuthContextType = useMemo(
    () => ({
      session,
      user,
      isLoading,
      isAuthenticated: !!user,
    }),
    [session, user, isLoading],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

/**
 * Hook to access authentication state
 * @returns Authentication context containing session, user, and auth state
 */
export function useAuth() {
  const context = use(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

/**
 * Hook to check if user is authenticated
 * @returns Boolean indicating if user is authenticated
 */
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

/**
 * Hook to get the current user
 * @returns Current user or null
 */
export function useUser() {
  const { user } = useAuth()
  return user
}
