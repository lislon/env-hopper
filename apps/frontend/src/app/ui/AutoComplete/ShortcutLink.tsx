import { SourceItem } from './common';
import React from 'react';
import { EhAutoCompleteProps } from './EhAutoComplete';

export function ShortcutLink(
  props: EhAutoCompleteProps & { item: SourceItem },
) {
  const shortcutAction = props.shortcutAction?.(props.item.id);
  if (shortcutAction === undefined) {
    return undefined;
  }

  if ('link' in shortcutAction) {
    return (
      <a
        href={shortcutAction.link}
        className="content-center p-1 hover:cursor-pointer"
        onClick={(event) => {
          event.preventDefault();
          return props.onClick?.(props.item.id);
        }}
      >
        <img
          src="/grasshopper-lsn.svg"
          alt={'Grasshopper Logo'}
          width={64}
          height={24}
        />
      </a>
    );
  } else {
    return (
      <button className="content-center p-1 hover:cursor-pointer">
        {`#${shortcutAction.substitutionTitle}`}
      </button>
    );
  }
}
