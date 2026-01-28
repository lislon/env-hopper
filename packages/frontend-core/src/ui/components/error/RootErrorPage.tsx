import { DefaultErrorComponent } from './DefaultErrorComponent'
import { ForbiddenErrorPage } from './ForbiddenErrorPage'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { AuthorizationError } from '~/errors/AuthorizationError'

/**
 * Smart error component that routes to appropriate error UI based on error type
 */
export function RootErrorPage(props: ErrorComponentProps) {
  const { error } = props

  // Handle authorization errors with custom 403 page
  if (AuthorizationError.isAuthorizationError(error)) {
    return <ForbiddenErrorPage error={error} />
  }

  // Handle other errors with default error component
  return (
    <div className="p-5">
      <DefaultErrorComponent {...props} />
    </div>
  )
}
