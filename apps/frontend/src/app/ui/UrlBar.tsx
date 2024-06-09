import React, { useState } from 'react';
import cn from 'classnames';
import { useEhContext } from '../context/EhContext';
import { EnvList } from './EnvList';

export function UrlPart({ text, children, open }: { text: string, children: React.ReactNode, open?: boolean }) {
  return <div
    className={cn('border border-dashed rounded py-2 px-1 m-1 hover:bg-gray-700 hover:cursor-pointer hover:border-solid inline-block relative')}
  >
    <div className={cn('absolute left-0 top-0 right-0 bottom-0', open ? 'visible' : 'opacity-0')}>
      {children}
    </div>
    <span className={open ? 'invisible' : 'visible'}>{text}</span>
  </div>;
}

export function UrlBar() {
  const { setEnv, listEnvs, listFavoriteEnvs, env, getEnvById, domainPart } = useEhContext();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return <div className="tracking-widest">
    {/*<div className="text-4xl space-x-2.5 mb-8">*/}
    {/*  https://sigdevdeploy-08.nateralab.com/prod-lims/case/view?id=123123*/}
    {/*</div>*/}
    <div className="text-4xl">
      <span>https://</span>
      <UrlPart text={domainPart} open={isOpen}>
        <EnvList onOpenChange={open => setIsOpen(open)} />
      </UrlPart>
      <UrlPart text="/prod-lims/case/view?id=">/prod-lims/case/view?id=</UrlPart>
      <UrlPart text="123123">123123</UrlPart>
    </div>
  </div>;
}
