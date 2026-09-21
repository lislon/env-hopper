import React from 'react';
import cn from 'classnames';
import { SourceItem } from './common';
import { UseComboboxPropGetters } from 'downshift';
import { EhAutoCompleteProps } from './EhAutoComplete';

export interface SuggestionProps {
  index: number;
  item: SourceItem;
  highlightedIndex: number;
  selectedItem: SourceItem | null;
  getItemProps: UseComboboxPropGetters<SourceItem>['getItemProps'];
  autoCompleteProps: EhAutoCompleteProps;
}

export function Suggestion({
  item,
  index,
  highlightedIndex,
  selectedItem,
  getItemProps,
}: SuggestionProps) {
  return (
    <li className={cn()} {...getItemProps({ item, index })}>
      <button
        className={cn('w-full inline-block', {
          focus: highlightedIndex === index,
          active: selectedItem?.id === item?.id,
        })}
      >
        {item.title}
      </button>
    </li>
  );
}
