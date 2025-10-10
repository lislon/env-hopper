import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from './AuthContext'

interface ProtectedProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requiredRole?: string // For future role-based access control
}

/**
 * Component to protect content based on authentication status
 * Only renders children if user is authenticated
 * @param children - Content to show when authenticated
 * @param fallback - Content to show when not authenticated (optional)
 */
export function ProtectedContent({
  children,
  fallback = null,
}: ProtectedProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return isAuthenticated ? <>{children}</> : <>{fallback}</>
}

/**
 * HOC to protect a component
 * Redirects to login if not authenticated, preserving the original URL
 * @param Component - Component to protect
 */
export function withProtection<TProps extends object>(
  Component: React.ComponentType<TProps>,
) {
  return function ProtectedComponent(props: TProps) {
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const pathname = useRouterState({ select: (s) => s.location.pathname })

    useEffect(() => {
      if (!isAuthenticated) {
        navigate({ to: '/login', search: { redirect: pathname } })
      }
    }, [isAuthenticated, navigate, pathname])

    if (!isAuthenticated) {
      return null
    }

    return <Component {...props} />
  }
}
