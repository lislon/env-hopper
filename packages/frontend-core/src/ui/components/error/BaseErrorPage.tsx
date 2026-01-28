import type { ReactNode } from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { MainLayout } from '~/ui/layout/MainLayout'
import { TopLevelProvidersForErrors } from '~/ui/layout/TopLevelProvidersForErrors'

export interface BaseErrorPageProps {
  children: ReactNode
}

/**
 * Common base component for all error pages
 * Provides consistent layout with TopLevelProvidersForErrors and MainLayout
 * Error pages should render their content as children of this component
 */
export function BaseErrorPage({ children }: BaseErrorPageProps) {
  return (
    <TopLevelProvidersForErrors>
      <MainLayout>
        {children}
        <TanStackRouterDevtools />
        <ReactQueryDevtools initialIsOpen={false} />
      </MainLayout>
    </TopLevelProvidersForErrors>
  )
}
