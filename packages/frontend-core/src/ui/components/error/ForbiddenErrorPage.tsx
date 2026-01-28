import { Link } from '@tanstack/react-router'
import { Home, Mail, ShieldAlert } from 'lucide-react'
import type { AuthorizationError } from '~/errors/AuthorizationError'
import { Button } from '~/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/ui/empty'
import { BaseErrorPage } from './BaseErrorPage'

export interface ForbiddenErrorPageProps {
  error: AuthorizationError
}

export function ForbiddenErrorPage({ error }: ForbiddenErrorPageProps) {
  const hasRoleInfo =
    error.requiredRoles !== undefined && error.requiredRoles.length > 0
  const hasPermissionInfo =
    error.requiredPermissions !== undefined &&
    error.requiredPermissions.length > 0

  return (
    <BaseErrorPage>
      <Empty role="alert">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlert className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>Access Denied</EmptyTitle>
          <EmptyDescription>
            {error.message}
            {error.resource && (
              <>
                <br />
                <span className="text-sm text-muted-foreground">
                  Resource: {error.resource}
                </span>
              </>
            )}
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          {(hasRoleInfo || hasPermissionInfo) && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg text-left max-w-md mx-auto">
              <p className="text-sm font-medium mb-2">Required Access:</p>
              {hasRoleInfo && (
                <div className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium">Roles: </span>
                  {error.requiredRoles.join(', ')}
                </div>
              )}
              {hasPermissionInfo && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Permissions: </span>
                  {error.requiredPermissions.join(', ')}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:support@example.com">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </a>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground max-w-md mx-auto">
            If you believe you should have access to this resource, please
            contact your administrator or support team.
          </p>
        </EmptyContent>
      </Empty>
    </BaseErrorPage>
  )
}
