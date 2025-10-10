import { createContext, use, useMemo, useState } from 'react'

interface AuthModalContextType {
  isOpen: boolean
  redirectUrl: string
  open: (redirectUrl?: string) => void
  close: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(
  undefined,
)

/**
 * Provider for global login modal state
 * Allows opening/closing modal from anywhere in the app
 */
export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState('/')

  const value = useMemo<AuthModalContextType>(() => ({
    isOpen,
    redirectUrl,
    open: (url?: string) => {
      setRedirectUrl(url || '/')
      setIsOpen(true)
    },
    close: () => setIsOpen(false),
  }), [isOpen, redirectUrl])

  return (
    <AuthModalContext value={value}>{children}</AuthModalContext>
  )
}

/**
 * Hook to access and control the login modal
 * @returns Object with isOpen, open, and close
 */
export function useAuthModal() {
  const context = use(AuthModalContext)
  if (!context) {
    throw new Error(
      'useAuthModal must be used within AuthModalProvider',
    )
  }
  return context
}
