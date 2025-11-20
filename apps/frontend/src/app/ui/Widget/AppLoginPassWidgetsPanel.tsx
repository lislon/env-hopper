import React, { Suspense } from 'react';
import { UiCredentials } from './UiCredentials/UiCredentials';
import cn from 'classnames';
import { ErrorBoundary } from 'react-error-boundary';
import { DbCredentialsWidget } from './DbCredentials/DbCredentialsWidget';
import { UnstableCustomWidget } from './UnstableCustomWidget/UnstableCustomWidget';
import { K8sCliWidget } from './K8sCliWidget/K8sCliWidget';

export interface AppWidgetsPanelProps {
  className?: string;
}

export function AppLoginPassWidgetsPanel({ className }: AppWidgetsPanelProps) {
  return (
    <div className={cn('flex justify-center', className)}>
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
  );
}
