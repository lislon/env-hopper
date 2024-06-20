'use client';
import React from 'react';
import cn from 'classnames';
import { useEhContext } from '../context/EhContext';

export function SubstitutionList() {
  const { substitutionType, substitution, setSubstitution } = useEhContext();
  if (!substitutionType) {
    return undefined;
  }
  return (
    <div>
      <label className="w-fit" htmlFor={'context'}>
        {substitutionType?.title}
      </label>
      <div className="flex shadow-sm border dark:border-0 dark:bg-black gap-0.5">
        <input
          id="context"
          type="text"
          placeholder={`Enter ${substitutionType?.title}`}
          autoComplete="false"
          autoFocus={true}
          className="w-full h-10 text-gray-500 p-2 text-xl"
          value={substitution?.value || ''}
          onChange={(e) =>
            setSubstitution({
              value: e.target.value,
              name: substitutionType?.name,
            })
          }
        />
      </div>
    </div>
  );
}
