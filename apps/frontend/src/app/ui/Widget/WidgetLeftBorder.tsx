import React from 'react';
import cn from 'classnames';

export interface WidgetLeftBorderProps {
  className?: string;
  children?: React.ReactNode;
}

export function WidgetLeftBorder({
  children,
  className,
}: WidgetLeftBorderProps) {
  return (
    <div
      className={cn('p-1 pl-0 flex flex-col gap-2 items-center w-6', className)}
    >
      {children}
    </div>
  );
}
