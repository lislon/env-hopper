import React from 'react';
import cn from 'classnames';

export interface SectionProps {
  children: React.ReactNode;
  className?: string;
  title: string;
  id: string;
}

export function Section({ children, title, id, className }: SectionProps) {
  const ariaLabelledby = `section-${id}`;
  return (
    <section aria-labelledby={ariaLabelledby}>
      <h2
        id={ariaLabelledby}
        className={cn(
          'flex items-center text-center text-sm text-gray-400',
          "before:content-[''] before:flex-1 before:border-b dark:before:border-gray-400 before:mr-0.5",
          "after:content-[''] after:flex-1 after:border-b dark:after:border-gray-400  after:ml-0.5",
          className,
        )}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
