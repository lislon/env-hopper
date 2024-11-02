import React from 'react';
import { UiCredentials } from './UiCredentials/UiCredentials';
import { DbCredentialsWidget } from './DbCredentials/DbCredentialsWidget';
import cn from 'classnames';
import { UnstableCustomWidget } from './UnstableCustomWidget/UnstableCustomWidget';
import { ErrorBoundary } from 'react-error-boundary';

export interface AppWidgetsPanelProps {
  className?: string;
}

export function AppWidgetsPanel({ className }: AppWidgetsPanelProps) {
  return (
    <div className={cn('flex flex-col gap-4 items-center', className)}>
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <UiCredentials />
      </ErrorBoundary>
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <DbCredentialsWidget />
      </ErrorBoundary>
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <UnstableCustomWidget />
      </ErrorBoundary>
    </div>
  );
}
