import React from 'react';
import { UiCredentials } from './UiCredentials/UiCredentials';
import { DbCredentialsWidget } from './DbCredentials/DbCredentialsWidget';
import cn from 'classnames';
import { UnstableCustomWidget } from './UnstableCustomWidget/UnstableCustomWidget';

export interface AppWidgetsPanelProps {
  className?: string;
}

export function AppWidgetsPanel({ className }: AppWidgetsPanelProps) {
  return (
    <div className={cn('flex flex-col gap-4 items-center', className)}>
      <UiCredentials />
      <DbCredentialsWidget />
      <UnstableCustomWidget />
    </div>
  );
}
