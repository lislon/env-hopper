import { Suspense } from 'react'
import cn from 'classnames'
import { ErrorBoundary } from 'react-error-boundary'
import { UiCredentials } from './UiCredentials/UiCredentials'
import { DbCredentialsWidget } from './DbCredentials/DbCredentialsWidget'
import { K8sCliWidget } from './K8sCliWidget/K8sCliWidget'
import { UnstableCustomWidget } from './UnstableCustomWidget/UnstableCustomWidget'

export interface AppLoginPassWidgetsPanelProps {
  className?: string
}

/**
 * The column of widgets beside the form: app UI credentials, app database
 * credentials, kubernetes commands, and per-app links.
 *
 * Each widget is wrapped on its own so one with unexpected data cannot take the
 * others down with it — a widget is a convenience, never a reason to lose the
 * form.
 */
export function AppLoginPassWidgetsPanel({
  className,
}: AppLoginPassWidgetsPanelProps) {
  return (
    <div
      className={cn('flex justify-center', className)}
      data-testid="widgets-panel"
    >
      <div className={'flex flex-col gap-4 w-full max-w-[300px]'}>
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <UiCredentials />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <DbCredentialsWidget />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <K8sCliWidget />
        </ErrorBoundary>

        <div className={cn('flex flex-col gap-4 items-start')}>
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <Suspense fallback={<>Loading widget...</>}>
              <UnstableCustomWidget />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
