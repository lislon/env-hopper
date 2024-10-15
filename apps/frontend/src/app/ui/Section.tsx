import React from 'react';

export interface SectionProps {
  children: React.ReactNode;
  title: string;
  id: string;
}

export function Section({ children, title, id }: SectionProps) {
  return (
    <>
      <li className={'menu-title'}>{title}</li>
      {children}
    </>
  );
}
