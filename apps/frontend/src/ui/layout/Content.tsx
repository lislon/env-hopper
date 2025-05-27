import React from 'react';
import { AutocompleteInput } from '../main/AutocompleteInput';
import { Breadcrumbs } from '../main/Breadcrumbs';
import { Tabs } from '../main/Tabs';
import { JumpTabContent } from '../main/JumpTabContent';

export function Content() {
  return (
    <div>
      <AutocompleteInput />
      <Breadcrumbs />
      <Tabs>
        <JumpTabContent />
        <div>Logs placeholder</div>
      </Tabs>
    </div>
  );
} 