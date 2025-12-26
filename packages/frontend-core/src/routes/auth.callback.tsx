import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
  validateSearch: (search: Record<string, unknown>) => ({
    error: search.error as string | undefined,
    code: search.code as string | undefined,
  }),
})

function AuthCallbackPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/auth/callback' })

  const errorMessages: Record<string, string> = {
    'internal_server_error': 'An internal server error occurred. Please try again.',
    'invalid_request': 'Invalid authentication request. Please try again.',
    'access_denied': 'Authentication was denied. Please try again.',
    'unauthorized_client': 'This client is not authorized. Please contact support.',
    'server_error': 'Server error occurred. Please try again.',
    'temporarily_unavailable': 'Authentication service is temporarily unavailable. Please try again later.',
  }

  const displayMessage = search.error
    ? errorMessages[search.error] || `Authentication failed: ${search.error}`
    : ''

  useEffect(() => {
    let cleanup: (() => void) | undefined

    if (search.error) {
      // Redirect to home after 5 seconds
      const timer = setTimeout(() => {
        navigate({ to: '/' })
      }, 5000)

      cleanup = () => clearTimeout(timer)
    } else if (!search.code) {
      // If no error and no code, redirect immediately
      navigate({ to: '/' })
    }

    return cleanup
  }, [search.error, search.code, navigate])

  if (search.error) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body">
            <h2 className="card-title text-error">Authentication Error</h2>
            <p className="text-base-content/70">{displayMessage}</p>
            <p className="text-sm text-base-content/50 mt-4">
              Redirecting you back home in a few seconds...
            </p>
            <div className="card-actions justify-end mt-4">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => navigate({ to: '/' })}
              >
                Go Home Now
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success case - redirect immediately
  return null
}
