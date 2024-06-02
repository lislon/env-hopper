'use client';
import React from 'react';
import cn from 'classnames';
import { useEhContext } from '../context/EhContext';


export function SubstitutionList() {
  const { substitutionType, substitution, setSubstitution } = useEhContext();
  if (!substitutionType) {
    return undefined;
  }
  return (<div className={cn(substitutionType ? 'opacity-100' : 'opacity-0', 'transition-all duration-200')}>
    <div>
      <label className="w-fit" htmlFor={'context'}>
        {substitutionType?.title}?
      </label>
      <div className="flex shadow-sm bg-black gap-0.5">
        <input id={'context'} type="text" placeholder={`ENTER ${substitutionType?.title.toUpperCase()}`}
               autoComplete="false" autoFocus={true}
               className="w-full h-16 text-center text-2xl text-gray-500"
               value={substitution?.value || ''}
               onChange={(e) => (setSubstitution({ value: e.target.value, name: substitutionType?.name }))}
        />
        <button
          aria-label="toggle menu"
          className="px-2 border border-black hover:border-amber-300"
          type="button"
        >
          <img
            src="/grasshopper-lsn.svg"
            // className="dark:invert"
            alt={'Grasshopper Logo'}
            className={'h-full'}
            width={64}
            height={64}
          />
        </button>

      </div>
    </div>
  </div>);
}
