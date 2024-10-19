import React from 'react';
import { EnvList } from './EnvList';
import { AppList } from './AppList';
import { SubstitutionList } from './SubstitutionList';
import { EnvQuickBar } from './QuickBar/EnvQuickBar';
import { AppQuickBar } from './QuickBar/AppQuickBar';

export function MainForm() {
  return (
    <>
      <div className="flex flex-col gap-3 w-full items-center">
        <EnvList className={'w-full'} />
        <EnvQuickBar className={'w-full'} />
        <AppList className={'w-full mt-8'} />
        <AppQuickBar className={'w-full'} />
        <SubstitutionList className={'w-full mt-8'} />
      </div>
      {/*<input*/}
      {/*  type="submit"*/}
      {/*  value="Mock button for autocomplete"*/}
      {/*  className="hidden"*/}
      {/*/>*/}
    </>
  );
}
