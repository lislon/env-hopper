import React from 'react';
import cn from 'classnames';

export interface SectionProps {
  children: React.ReactNode;
  title: string;
  id: string;
}

export function Section({ children, title, id }: SectionProps) {
  const ariaLabelledby = `section-${id}`;
  return (
    <section aria-labelledby={ariaLabelledby}>
      <h2
        id={ariaLabelledby}
        className={cn(
          'flex items-center text-center text-sm',
          "before:content-[''] before:flex-1 before:border-b dark:before:border-white before:mr-0.5",
          "after:content-[''] after:flex-1 after:border-b dark:after:border-white after:ml-0.5"
        )}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
