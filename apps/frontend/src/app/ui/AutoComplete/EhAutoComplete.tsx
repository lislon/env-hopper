import React, { useEffect, useState } from 'react';
import { useCombobox } from 'downshift';
import cn from 'classnames';
import { Item, suggestionHeightClass } from './common';
import {
  flatmapToItemsWithSections,
  ItemWithSection,
  mapToItemWithSection,
} from './section-splitting';
import { ItemsSections } from './ItemsSections';
import { first, sortBy } from 'lodash';

export type EhAutoCompleteFilter = (
  searchPattern: string,
  items: Item[]
) => Item[];

export type OnSelectedItemChange = (item: string | undefined) => void;

export type ShortcutJump = { link: string };
export type ShortcutPickSubstitution = { substitutionTitle: string };
export type ShortcutAction = ShortcutJump | ShortcutPickSubstitution;

export interface AutoCompleteProps {
  itemsAll: Item[];
  placeholder?: string;
  label?: string;
  filter: EhAutoCompleteFilter;
  onSelectedItemChange: OnSelectedItemChange;
  selectedItem: Item | null;
  shortcutAction?: (id: string) => ShortcutAction | undefined;
  onClick?: (id: string) => void;
  onFavoriteToggle?: (item: Item, isOn: boolean) => void;
  onOpenChange?: (isOpen: boolean) => void;
  onCtrlEnter?: () => void;
}

function getInitialItems(collection: Item[]) {
  return flatmapToItemsWithSections(sortBy(collection, 'title'), false);
}

export function EhAutoComplete(props: AutoCompleteProps) {
  const [items, setItems] = useState(() =>
    getInitialItems(props.itemsAll)
  );

  const [tmpFavorite, setTmpFavorite] = useState<Map<string, boolean>>(
    new Map()
  );

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    getToggleButtonProps,
    selectItem,
    selectedItem,
  } = useCombobox<ItemWithSection>({
    onInputValueChange({ inputValue }) {
      const userSearching = inputValue !== '';
      const items = props.filter(inputValue, props.itemsAll);
      const itemWithFakeIds = flatmapToItemsWithSections(items, userSearching);
      setItems(itemWithFakeIds);
      if (inputValue === '') {
        props.onSelectedItemChange(undefined);
      }
    },
    onSelectedItemChange({ selectedItem }) {
      props.onSelectedItemChange(selectedItem?.id || undefined);
    },
    selectedItem: first(mapToItemWithSection(props.selectedItem, false)) || null,
    items,
    itemToString(item) {
      return item ? item.title : '';
    },
  });
  const inputRef = React.createRef<HTMLInputElement>();
  const onOpenChange = props.onOpenChange;

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  function preselectAndShowAllOptions() {
    inputRef.current?.select();
    setItems(getInitialItems(props.itemsAll));
  }

  const inputProps = getInputProps({
    ref: inputRef,
    onFocus: preselectAndShowAllOptions,
    onClick: preselectAndShowAllOptions,
    onKeyDown: (event) => {
      if (event.ctrlKey && event.key === 'Enter') {
        props.onCtrlEnter?.();
      } else if (event.key === 'Enter' && isOpen && items.length === 1) {
        selectItem(items[0]);
        props.onSelectedItemChange(items[0].id);
      }
    },
  });
  return (
    <div>
      <div className="w-full flex flex-col gap-1">
        {props.label && (
          <label className="w-fit" {...getLabelProps()}>
            {props.label}
          </label>
        )}
        <div className="flex shadow-sm border dark:border-0 dark:bg-black gap-0.5">
          <input
            placeholder={props.placeholder}
            className={`w-full ${suggestionHeightClass} text-xl text-gray-500 rounded p-2`}
            {...inputProps}
          />
          <button
            aria-label="toggle menu"
            className="px-2"
            type="button"
            {...getToggleButtonProps()}
          >
            {isOpen ? <>&#8593;</> : <>&#8595;</>}
          </button>
        </div>
      </div>
      {
        <div className="relative w-full">
          <div
            className={cn(
              `w-full bg-white dark:bg-gray-900 mt-1 shadow-md p-0 z-10 absolute max-h-[50vh] overflow-y-scroll`,
              !(isOpen && items.length) && 'hidden'
            )}
            {...getMenuProps()}
          >
            {isOpen && (
              <ItemsSections
                items={items}
                highlightedIndex={highlightedIndex}
                getItemProps={getItemProps}
                tmpFavorite={tmpFavorite}
                setTmpFavorite={setTmpFavorite}
                selectedItem={selectedItem}
                autoCompleteProps={props}
              />
            )}
          </div>
        </div>
      }
    </div>
  );
}
