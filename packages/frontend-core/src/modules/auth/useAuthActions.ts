import { useCallback } from 'react'

interface LoginCredentials {
  email: string
  password: string
}

interface SignupCredentials extends LoginCredentials {
  name: string
}

/**
 * Hook for authentication actions (login, signup, logout)
 */
export function useAuthActions() {
  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    return response.json()
  }, [])

  const signup = useCallback(async (credentials: SignupCredentials) => {
    const response = await fetch('/api/auth/sign-up/email', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Signup failed')
    }

    return response.json()
  }, [])

  const logout = useCallback(async () => {
    const response = await fetch('/api/auth/sign-out', {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    // Clear session and reload to update UI
    window.location.href = '/'
  }, [])

  const socialLogin = useCallback(async (provider: 'github' | 'google') => {
    const response = await fetch(`/api/auth/signin/${provider}`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`${provider} login failed`)
    }

    const data = await response.json()
    // Redirect to provider's OAuth flow
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl
    }
  }, [])

  return {
    login,
    signup,
    logout,
    socialLogin,
  }
}
