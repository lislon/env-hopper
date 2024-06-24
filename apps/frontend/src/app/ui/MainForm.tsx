import React from 'react';
import { EnvList } from './EnvList';
import { AppList } from './AppList';
import { SubstitutionList } from './SubstitutionList';

export function MainForm() {
  return (
    <form onSubmit={(e) => { e.preventDefault(); }}>
      <div className="flex flex-col gap-3 w-full">
        <EnvList />
        <AppList />
        <SubstitutionList />
      </div>
      <input type="submit" value="Mock button for autocomplete" className="hidden" />
    </form>
  );
}
