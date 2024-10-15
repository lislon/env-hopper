import React from 'react';
import { EnvList } from './EnvList';
import { AppList } from './AppList';
import { SubstitutionList } from './SubstitutionList';
import { EnvQuickBar } from './QuickBar/EnvQuickBar';
import { AppQuickBar } from './QuickBar/AppQuickBar';

export function MainForm() {
  return (
    <div>
      <div className="flex flex-col gap-3">
        <EnvList />
        <EnvQuickBar />
        <AppList />
        <AppQuickBar />
        <SubstitutionList />
      </div>
      <input
        type="submit"
        value="Mock button for autocomplete"
        className="hidden"
      />
    </div>
  );
}
