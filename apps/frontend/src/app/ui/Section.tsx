import React from 'react';
import cn from 'classnames';

export function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section>
      <div
        className={cn(
          'flex items-center text-center text-sm',
          "before:content-[''] before:flex-1 before:border-b dark:before:border-white before:mr-0.5",
          "after:content-[''] after:flex-1 after:border-b dark:after:border-white after:ml-0.5"
        )}
      >
        {title}
      </div>
      {children}
    </section>
  );
}
