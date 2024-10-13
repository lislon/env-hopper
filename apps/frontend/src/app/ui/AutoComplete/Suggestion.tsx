import React from 'react';
import cn from 'classnames';
import { Item } from './common';
import { UseComboboxPropGetters } from 'downshift';
import { AutoCompleteProps } from './EhAutoComplete';
import { Link } from 'react-router-dom';

export interface SuggestionProps {
  index: number;
  item: Item;
  highlightedIndex: number;
  selectedItem: Item | null;
  getItemProps: UseComboboxPropGetters<Item>['getItemProps'];
  autoCompleteProps: AutoCompleteProps;
}

export function Suggestion({
  item,
  index,
  highlightedIndex,
  selectedItem,
  getItemProps,
  autoCompleteProps,
}: SuggestionProps) {
  return (
    <li className={cn()} {...getItemProps({ item, index })}>
      <Link
        to={autoCompleteProps.getEhUrl(item.id)}
        className={cn('w-full inline-block', {
          focus: highlightedIndex === index,
          active: selectedItem?.id === item?.id,
        })}
      >
        {item.title}
      </Link>
    </li>
  );
}
