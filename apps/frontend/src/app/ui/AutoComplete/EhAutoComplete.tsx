import React, { useEffect, useMemo, useState } from 'react';
import { useCombobox } from 'downshift';
import { SourceItem } from './common';
import { SectionedItem } from './section-splitting';
import { ItemsSections } from './ItemsSections';
import { keyBy, uniq } from 'lodash';
import cn from 'classnames';

export type EhAutoCompleteFilter = (
  searchPattern: string,
  items: SourceItem[],
) => SourceItem[];

export type OnSelectedItemChange = (itemId: string | undefined) => void;

export interface EhAutoCompleteProps {
  className?: string;
  inputClassName?: string;
  itemsAll: SourceItem[];
  placeholder?: string;
  label?: string;
  filter: EhAutoCompleteFilter;
  onSelectedItemChange: OnSelectedItemChange;
  selectedItem: SourceItem | null;
  onClick?: (id: string) => void;
  onFavoriteToggle?: (item: SourceItem, isOn: boolean) => void;
  onOpenChange?: (isOpen: boolean) => void;
  onPrimaryAction?: () => void;
  autoFocus?: boolean;
  favoriteButton?: React.ReactNode;
  getEhUrl: (id: string) => string;
  id?: string;
  allSectionedItems: SectionedItem[];
  tmpSameSubstitutionTitle?: string;
}

export function EhAutoComplete(props: EhAutoCompleteProps) {
  const initialItemsWithSections = props.allSectionedItems;
  const sectionItemById = useMemo(() => {
    return keyBy(
      initialItemsWithSections.filter((i) => i.section === 'all'),
      'id',
    );
  }, [initialItemsWithSections]);

  const [displayedItems, setDisplayedItems] = useState(
    () => initialItemsWithSections,
  );

  const selectedItemWithSection = useMemo(() => {
    const needle = props.selectedItem;
    return (
      needle &&
      (initialItemsWithSections.find((v) => {
        return v.id === needle.id;
      }) ||
        null)
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
  } = useCombobox<SectionedItem>({
    onInputValueChange({ inputValue, isOpen }) {
      const userUsesFilter = inputValue !== '';
      if (isOpen) {
        if (userUsesFilter) {
          const matchedIds = uniq(
            props.filter(inputValue, props.itemsAll).map((i) => i.id),
          );
          setDisplayedItems(matchedIds.map((id) => sectionItemById[id]));
        } else {
          // show all
          setDisplayedItems(initialItemsWithSections);
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
    items: displayedItems,
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
    setDisplayedItems(initialItemsWithSections);
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
        props.onPrimaryAction?.();
      } else if (
        event.key === 'Enter' &&
        isOpen &&
        displayedItems.length > 0 &&
        highlightedIndex === -1
      ) {
        // user has input, and it shows several results, but there is not single line selected. On enter, we want to pick a first result.
        selectItem(displayedItems[0]);
        props.onSelectedItemChange(displayedItems[0].id);
      } else if (event.key === 'Enter' && !isOpen) {
        props.onPrimaryAction?.();
      }
    },
  });

  return (
    <div className={cn('relative', props.className)}>
      <div className="w-full relative inline-block">
        <label
          className="form-control w-full relative px-1"
          {...getLabelProps()}
        >
          <div className="label prose">
            <h4>{props.label}</h4>
          </div>
          <input
            type="text"
            placeholder={props.placeholder}
            className={cn(
              'input input-bordered w-full',
              { ['pr-10']: props.favoriteButton !== undefined },
              props.inputClassName,
            )}
            {...inputProps}
          />
          <div className={'absolute bottom-0 right-4 h-[3rem] flex'}>
            {props.favoriteButton}
          </div>
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
          {displayedItems.length > 0 ? (
            <ItemsSections
              tmpSameSubstitutionTitle={props.tmpSameSubstitutionTitle}
              items={displayedItems}
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
    </div>
  );
}
