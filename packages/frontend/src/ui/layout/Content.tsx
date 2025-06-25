import React from 'react';
import { AutocompleteInputBase } from '../main/AutocompleteInputBase';
import { Breadcrumbs } from '../main/Breadcrumbs';
import { Tabs } from '../main/Tabs';
import { JumpTabContent } from '../main/JumpTabContent';
import { Playground } from '~/ui/autocomplete/Playground';

export function Content() {
  return (
    <div>
      <AutocompleteInputBase />
      {/*<Playground />*/}
      <Breadcrumbs />
      <Tabs>
        <JumpTabContent />
        <div>Logs placeholder</div>
      </Tabs>
    </div>
  );
}
