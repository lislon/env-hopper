import { EhAppMetaNote } from '@env-hopper/types';
import React from 'react';

export function NoteSection({ meta }: { meta: EhAppMetaNote }) {
  return (
    <div className="flex">
      <div className="py-1 pr-2" title="Credentials for the app">
        <svg
          className="w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM6 7h12v2H6V7Zm0 4h12v2H6v-2Zm0 4h9v2H6v-2Z" />
        </svg>
      </div>
      <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2">
        <div className="grid text-sm grid-rows-2 gap-1 items-center">
          <div>{meta.note}</div>
        </div>
      </div>
    </div>
  );
}
