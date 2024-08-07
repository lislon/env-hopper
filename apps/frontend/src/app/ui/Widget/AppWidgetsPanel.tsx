import React from 'react';
import { useEhContext } from '../../context/EhContext';
import { UiCredentials } from './UiCredentials/UiCredentials';
import { DbCredentialsWidget } from './DbCredentials/DbCredentialsWidget';

export function AppWidgetsPanel() {
  const { app } = useEhContext();

  const meta = app?.meta;
  if (meta?.db || meta?.ui) {
    return (
      <div className="absolute -right-64 top-0 -mr-16 w-64 border border-gray-400 dark:bg-gray-600 dark:border-0 rounded shadow-xl p-2 opacity-50">
        <div className={'grid gap-4'}>
          {meta.ui && <UiCredentials meta={meta.ui} />}
          {meta.db && <DbCredentialsWidget meta={meta.db} />}
        </div>
        {/*{metaHasNote(meta) && <NoteSection meta={meta} />}*/}
      </div>
    );
  }
  return null;
}
