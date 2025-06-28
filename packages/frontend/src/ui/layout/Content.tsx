import React from 'react';
import { AutocompleteInputBase } from '../main/AutocompleteInputBase';
import { Breadcrumbs } from '../main/Breadcrumbs';
import { Tabs } from '../main/Tabs';
import { JumpTabContent } from '../main/JumpTabContent';
import { Home } from '~/ui/home/Home';

export function Content() {
  return (
    <div>
      <Home />
      <AutocompleteInputBase />
      <Breadcrumbs />
      <Tabs>
        <JumpTabContent />
        <div>Logs placeholder</div>
      </Tabs>
    </div>
  );
}
