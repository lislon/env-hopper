import React, { useState, useMemo } from 'react';
import { useCombobox } from 'downshift';
import {
  appsAutocompleteMockedData,
  AppsForAutoComplete,
} from '~/data/appsAutocompleteMockedData';
import { AppAutocompletePopover } from './AppAutocompletePopover';
import { Input } from '~/components/ui/input';

export function AppAutocompleteInput() {
  // Keep original list as a ref
  const items = useMemo(() => appsAutocompleteMockedData, []);
  const [inputItems, setInputItems] = useState<AppsForAutoComplete[]>(items);

  const {
    isOpen,
    highlightedIndex,
    getInputProps,
    getItemProps,
    getMenuProps,
  } = useCombobox<AppsForAutoComplete>({
    items: inputItems,
    itemToString: (item) =>
      item ? `${item.app} ${item.group ?? ''} ${item.title}` : '',
    onInputValueChange({ inputValue }) {
      if (typeof inputValue !== 'string') return;
      const lower = inputValue.toLowerCase();
      setInputItems(
        items.filter((it) =>
          `${it.app} ${it.group ?? ''} ${it.title}`
            .toLowerCase()
            .includes(lower),
        ),
      );
    },
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) {
        // For now, we just log. This can be replaced with navigation.
        console.info('Selected item', selectedItem);
      }
    },
  });

  return (
    <div className="relative w-full">
      <Input
        {...getInputProps({
          placeholder: 'Search apps…',
        })}
        className="w-full"
      />
      {isOpen && (
        <div className="absolute left-0 right-0 z-10">
          <AppAutocompletePopover
            items={inputItems}
            getMenuProps={getMenuProps}
            getItemProps={getItemProps}
            highlightedIndex={highlightedIndex}
          />
        </div>
      )}
    </div>
  );
}
