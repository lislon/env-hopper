import React from 'react';
import cn from 'classnames';
import { EnvList } from './EnvList';
import { AppList } from './AppList';
import { SubstitutionList } from './SubstitutionList';

export function UrlPart({ text, children, open }: { text: string, children: React.ReactNode, open?: boolean }) {
  return <div
    className={cn('border border-dashed rounded py-2 px-1 m-1 hover:bg-gray-700 inline-block relative', { 'hover:cursor-pointer hover:border-solid': !open })}
  >
    <div className={cn('absolute left-0 top-0 right-0 bottom-0', open ? 'visible' : 'opacity-0')}>
      {children}
    </div>
    <span className={open ? 'invisible' : 'visible'}>{text}</span>
  </div>;
}

export function UrlBar() {
  return <div className="flex flex-col gap-3 w-full">
    <EnvList />
    <AppList />
    <SubstitutionList />
  </div>

}
