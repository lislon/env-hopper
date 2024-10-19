import React, { useEffect, useMemo, useState } from 'react';
import { useCombobox } from 'downshift';
import { Item } from './common';
import {
  flatmapToItemsWithSections,
  ItemWithSection,
  mapToItemWithSection,
} from './section-splitting';
import { ItemsSections } from './ItemsSections';
import { first, keyBy, sortBy, uniq } from 'lodash';
import cn from 'classnames';

export type EhAutoCompleteFilter = (
  searchPattern: string,
  items: Item[],
) => Item[];

export type OnSelectedItemChange = (item: string | undefined) => void;

export type ShortcutJump = { link: string };
export type ShortcutPickSubstitution = { substitutionTitle: string };
export type ShortcutAction = ShortcutJump | ShortcutPickSubstitution;

export interface AutoCompleteProps {
  className?: string;
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
  onTryJump?: () => void;
  autoFocus?: boolean;
  tailButtons?: React.ReactNode;
  getEhUrl: (id: string) => string;
  id?: string;
}

function getInitialItems(collection: Item[]) {
  return flatmapToItemsWithSections(sortBy(collection, 'title'), false);
}

export function EhAutoComplete(props: AutoCompleteProps) {
  const initialItemsWithSections = useMemo(() => {
    return getInitialItems(props.itemsAll);
  }, [props.itemsAll]);
  const sectionItemById = useMemo(() => {
    return keyBy(
      initialItemsWithSections.filter((i) => i.section === 'all'),
      'id',
    );
  }, [initialItemsWithSections]);

  const [itemsWithSections, setItemsWithSections] = useState(
    () => initialItemsWithSections,
  );

  const selectedItemWithSection = useMemo(() => {
    const needle = first(mapToItemWithSection(props.selectedItem, false));
    if (!needle) {
      return null;
    }
    return (
      initialItemsWithSections.find((v) => {
        return v.section === needle.section && v.id === needle.id;
      }) || null
    );
  }, [initialItemsWithSections, props.selectedItem]);

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    selectItem,
    selectedItem,
    inputValue,
  } = useCombobox<ItemWithSection>({
    onInputValueChange({ inputValue, isOpen }) {
      const userUsesFilter = inputValue !== '';
      if (isOpen) {
        if (userUsesFilter) {
          // const matchedIds = new Set(
          //   props.filter(inputValue, props.itemsAll).map((i) => i.id),
          // );
          const matchedIds = uniq(
            props.filter(inputValue, props.itemsAll).map((i) => i.id),
          );
          setItemsWithSections(matchedIds.map((id) => sectionItemById[id]));
        } else {
          // show all
          setItemsWithSections(initialItemsWithSections);
        }
      }
      // if (inputValue === '') {
      //   props.onSelectedItemChange(undefined);
      // }
    },
    onSelectedItemChange({ selectedItem }) {
      props.onSelectedItemChange(selectedItem?.id || undefined);
    },
    selectedItem: selectedItemWithSection,
    items: itemsWithSections,
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
    setItemsWithSections(getInitialItems(props.itemsAll));
  }

  const inputProps = getInputProps({
    ref: inputRef,
    autoFocus: props.autoFocus,
    onFocus: preselectAndShowAllOptions,
    onClick: preselectAndShowAllOptions,
    onBlur: () => {
      if (inputValue === '') {
        props.onSelectedItemChange(undefined);
      }
    },
    onKeyDown: (event) => {
      if (event.ctrlKey && event.key === 'Enter') {
        props.onTryJump?.();
      } else if (
        event.key === 'Enter' &&
        isOpen &&
        itemsWithSections.length > 0 &&
        highlightedIndex === -1
      ) {
        // user has input, and it shows several results, but there is not single line selected. On enter, we want to pick a first result.
        selectItem(itemsWithSections[0]);
        props.onSelectedItemChange(itemsWithSections[0].id);
      } else if (event.key === 'Enter' && !isOpen) {
        props.onTryJump?.();
      }
    },
  });

  return (
    <div className={cn('relative', props.className)}>
      <div className="w-full relative inline-block">
        <label className="form-control w-full" {...getLabelProps()}>
          <div className="label prose">
            <h4>{props.label}</h4>
          </div>
          <input
            type="text"
            placeholder={props.placeholder}
            className="input input-bordered w-full"
            {...inputProps}
          />
        </label>
        <ul
          tabIndex={0}
          className={cn(
            `absolute menu bg-base-200 z-[1] w-full p-2 shadow origin-top transform transition duration-200 ease-out mt-1 max-h-[60vh] flex-nowrap overflow-auto`,
            {
              'scale-100': isOpen,
              'scale-95 invisible opacity-0': !isOpen,
            },
          )}
          {...getMenuProps()}
        >
          {itemsWithSections.length > 0 ? (
            <ItemsSections
              items={itemsWithSections}
              highlightedIndex={highlightedIndex}
              getItemProps={getItemProps}
              selectedItem={selectedItem}
              autoCompleteProps={props}
            />
          ) : (
            <div className={'italic text-center p-2'}>
              No results for '{inputValue}'
            </div>
          )}
        </ul>
      </div>
      <div className={'absolute bottom-2 right-4'}>{props.tailButtons}</div>
    </div>
  );
}
