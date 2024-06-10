import React, { useState } from 'react';
import cn from 'classnames';
import { useEhContext } from '../context/EhContext';
import { EnvList } from './EnvList';
import { AppList } from './AppList';

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
  const { domainPart, appPart } = useEhContext();
  const [isEnvOpen, setIsEnvOpen] = useState<boolean>(false);
  const [isAppOpen, setIsAppOpen] = useState<boolean>(false);

  return <div className="tracking-widest">
    <div className="text-4xl">
      <span>https://</span>
      <UrlPart text={domainPart} open={isEnvOpen}>
        <EnvList onOpenChange={open => setIsEnvOpen(open)} />
      </UrlPart>
      <UrlPart text={appPart} open={isAppOpen}>
        <AppList onOpenChange={open => setIsAppOpen(open)} />
      </UrlPart>
      <UrlPart text="123123">123123</UrlPart>
    </div>
  </div>;
}
