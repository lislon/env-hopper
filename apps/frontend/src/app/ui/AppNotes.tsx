import React from 'react';
import { ReadonlyCopyField } from './ReadonlyCopyField';
import { metaHasNote, metaHasUsernamePassword } from '../lib/utils';
import { useEhContext } from '../context/EhContext';
import { EhAppMetaCredentials, EhAppMetaNote } from '@env-hopper/types';

function UserNameSection({ meta }: { meta: EhAppMetaCredentials }) {
  return <div className="flex">
    <div className="py-1 pr-2" title="Credentials for the app">
      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
        <path
          d="M12 2a6 6 0 0 0-6 6v2H5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1h-1V8a6 6 0 0 0-6-6Zm4 8H8v-2a4 4 0 1 1 8 0Zm-8 4h4a1 1 0 0 1 0 2h-4a1 1 0 0 1 0-2Zm0 4h6a1 1 0 0 1 0 2h-6a1 1 0 0 1 0-2Z" />
      </svg>
    </div>
    <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2">
      <div className="grid text-sm grid-rows-2 gap-1 items-center">
        <div>
          <ReadonlyCopyField value={meta.username} />
        </div>
        <div>
          <ReadonlyCopyField value={meta.password} />
        </div>
      </div>
    </div>
  </div>;
}

function NoteSection({ meta }: { meta: EhAppMetaNote }) {
  return <div className="flex">
    <div className="py-1 pr-2" title="Credentials for the app">
      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
        <path
          d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM6 7h12v2H6V7Zm0 4h12v2H6v-2Zm0 4h9v2H6v-2Z" />
      </svg>
    </div>
    <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2">
      <div className="grid text-sm grid-rows-2 gap-1 items-center">
        <div>
          {meta.note}
        </div>
      </div>

    </div>
  </div>;
}

export function AppNotes() {
  const { app } = useEhContext();

  const meta = app?.meta;
  if (!metaHasUsernamePassword(meta) && !metaHasNote(meta))
    return null;

  return (<div
    className="absolute -right-64 top-0 -mr-16 w-64 border border-gray-400 dark:bg-gray-600 dark:border-0 rounded shadow-xl p-2 opacity-50">
    {metaHasUsernamePassword(meta) && <UserNameSection meta={meta} />}
    {metaHasNote(meta) && <NoteSection meta={meta} />}
  </div>);

}
