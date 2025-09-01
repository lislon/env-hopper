import React from 'react';

export interface SectionProps {
  children: React.ReactNode;
  title: string;
  testId?: string;
}

export function Section({ children, title, testId }: SectionProps) {
  return (
    <>
      <li className={'menu-title'} data-testid={testId}>
        {title}
      </li>
      {children}
    </>
  );
}
