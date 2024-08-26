import React from 'react';
import { EnvList } from './EnvList';
import { AppList } from './AppList';
import { SubstitutionList } from './SubstitutionList';
import { EnvFavoriteBar } from './FavoriteBar/EnvFavoriteBar';
import { AppFavoriteBar } from './FavoriteBar/AppFavoriteBar';

export function MainForm() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div className="flex flex-col gap-3">
        <EnvList />
        <EnvFavoriteBar />
        <AppList />
        <AppFavoriteBar />
        <SubstitutionList />
      </div>
      <input
        type="submit"
        value="Mock button for autocomplete"
        className="hidden"
      />
    </form>
  );
}
