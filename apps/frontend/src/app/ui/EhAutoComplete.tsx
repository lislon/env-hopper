import React, { useEffect, useState } from 'react';
import { useCombobox, UseComboboxPropGetters } from 'downshift';
import cn from 'classnames';


export interface Item {
  id: string;
  title: string;
  favorite?: boolean;
}

export type EhAutoCompleteFilter = (inputValue: string) => (item: Item) => boolean;

export type OnSelectedItemChange = (item: string | undefined) => void;

export type ShortcutJump = { link: string };
export type ShortcutPickSubstitution = { substitutionTitle: string };
export type ShortcutAction = ShortcutJump | ShortcutPickSubstitution;

const height = 'h-14';

export interface AutoCompleteProps {
  itemsAll: Item[];
  placeholder?: string;
  label?: string;
  filter: EhAutoCompleteFilter;
  onSelectedItemChange: OnSelectedItemChange;
  selectedItem: Item | undefined;
  shortcutAction?: (id: string) => ShortcutAction | undefined;
  onClick?: (id: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

function ShortcutLink(props: AutoCompleteProps & { item: Item }) {
  const shortcutAction = props.shortcutAction?.(props.item.id);
  if (shortcutAction === undefined) {
    return undefined;
  }

  if ('link' in shortcutAction) {
    return <a href={shortcutAction.link}
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
    </a>;
  } else {
    return <button className="content-center p-1 hover:cursor-pointer">
      {`#${shortcutAction.substitutionTitle}`}
    </button>;
  }

}


export interface ItemPrinterProps {
  index: number;
  item: Item;
  highlightedIndex: number;
  selectedItem?: Item;
  getItemProps: UseComboboxPropGetters<Item>['getItemProps'];
  autoCompleteProps: AutoCompleteProps;

}

function ItemPrinter({
                       item,
                       index,
                       highlightedIndex,
                       selectedItem,
                       getItemProps,
                       autoCompleteProps
                     }: ItemPrinterProps) {
  return (
    <li
      className={cn(
        highlightedIndex === index && 'bg-gray-700',
        selectedItem === item && 'font-bold',
        `${height} py-2 px-3 shadow-sm flex flex-row justify-between`,
        'grayscale hover:grayscale-0'
      )}
      {...getItemProps({ item, index })}
    >
      <span className="content-center">{item.title}</span>
      <ShortcutLink {...autoCompleteProps} item={item} />
    </li>
  );

}

export interface ItemsSectionProps {
  items: Item[];
  highlightedIndex: number;
  selectedItem: Item | null;
  getItemProps: UseComboboxPropGetters<Item>['getItemProps'];
  autoCompleteProps: AutoCompleteProps;
}


function ItemsSection({ items, highlightedIndex, selectedItem, getItemProps, autoCompleteProps }: ItemsSectionProps) {

  const itemsWithIndex = items.map((item, index) => ({ ...item, index }));

  const favSlice = itemsWithIndex.filter(item => item.favorite);
  const regularSlice = itemsWithIndex.filter(item => !item.favorite);

  return (<>
    {favSlice.map((item) =>
      <ItemPrinter index={item.index} item={item} highlightedIndex={highlightedIndex} getItemProps={getItemProps}
                   autoCompleteProps={autoCompleteProps} />
    )}
    <div
      className={cn('flex items-center text-center text-sm',
        'before:content-[\'\'] before:flex-1 before:border-b before:border-white before:mr-0.5',
        'after:content-[\'\'] after:flex-1 after:border-b after:border-white after:ml-0.5',
      )}>⭐
      Favorites
    </div>

    {regularSlice.map((item) =>
      <ItemPrinter index={item.index} item={item} highlightedIndex={highlightedIndex} getItemProps={getItemProps}
                   autoCompleteProps={autoCompleteProps} />
    )}
  </>);
}


export function EhAutoComplete(props: AutoCompleteProps) {
  const [items, setItems] = useState(props.itemsAll);
  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    reset,
    selectedItem
  } = useCombobox({
    onInputValueChange({ inputValue }) {
      setItems(props.itemsAll.filter(props.filter(inputValue)));
      if (inputValue === '') {
        props.onSelectedItemChange(undefined);
      }
    },
    onSelectedItemChange({ selectedItem }) {
      props.onSelectedItemChange(selectedItem?.id || undefined);
    },
    selectedItem: props.selectedItem,
    items,
    itemToString(item) {
      return item ? item.title : '';
    }
  });
  const inputRef = React.createRef<HTMLInputElement>();
  const onOpenChange = props.onOpenChange;

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  function preselectAndShowAllOptions() {
    inputRef.current?.select();
    setItems(props.itemsAll);
  }

  const inputProps = getInputProps({
    ref: inputRef,
    onFocus: preselectAndShowAllOptions,
    onClick: preselectAndShowAllOptions
  });
  return (
    <>
      <div className="w-full flex flex-col gap-1">
        {props.label && <label className="w-fit" {...getLabelProps()}>
          {props.label}
        </label>}
        <div className="flex shadow-sm bg-black gap-0.5">
          <input
            placeholder={props.placeholder}
            className={`w-full ${height} text-center text-2xl text-gray-500 rounded`}
            {...inputProps}
          />
        </div>
      </div>
      {isOpen && <div className="relative w-full">
        <ul
          className={cn(`w-full bg-gray-900 mt-1 shadow-md p-0 z-10 absolute max-h-80 overflow-y-scroll min-w-[800px]`,
            !(isOpen && items.length) && 'hidden')}
          {...getMenuProps()}
        >
          {isOpen && <ItemsSection items={items} highlightedIndex={highlightedIndex} getItemProps={getItemProps}
                                   selectedItem={selectedItem}
                                   autoCompleteProps={props} />}
        </ul>
      </div>}
    </>
  );
}
