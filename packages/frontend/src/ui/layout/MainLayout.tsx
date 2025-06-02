import React from 'react';

type MainLayoutProps = {
  content: React.ReactNode;
  side: React.ReactNode;
};

export function MainLayout({ content, side }: MainLayoutProps) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <main className="col-span-12 md:col-span-9">{content}</main>
      <aside className="col-span-12 md:col-span-3">{side}</aside>
    </div>
  );
} 