import React, { MouseEventHandler, useEffect, useState } from 'react';
import { useCombobox, UseComboboxPropGetters } from 'downshift';
import cn from 'classnames';
import { Section } from './Section';
import { StarIcon } from './StarIcon';


export interface Item {
  id: string;
  title: string;
  favorite?: boolean;
  recent?: boolean;
}

export type EhAutoCompleteFilter =(searchPattern: string , items: Item[] ) => Item[];


export type OnSelectedItemChange = (item: string | undefined) => void;

export type ShortcutJump = { link: string };
export type ShortcutPickSubstitution = { substitutionTitle: string };
export type ShortcutAction = ShortcutJump | ShortcutPickSubstitution;

const height = 'h-10';

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

function ShortcutLink(props: AutoCompleteProps & { item: Item }) {
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

export interface ItemPrinterProps {
  index: number;
  item: Item;
  highlightedIndex: number;
  selectedItem: Item | null;
  getItemProps: UseComboboxPropGetters<Item>['getItemProps'];
  autoCompleteProps: AutoCompleteProps;
  tmpFavorite: Map<string, boolean>;
  setTmpFavorite: (tmpFavorite: Map<string, boolean>) => void;
}

function ItemPrinter({
  item,
  index,
  highlightedIndex,
  selectedItem,
  getItemProps,
  autoCompleteProps,
  tmpFavorite,
  setTmpFavorite,
}: ItemPrinterProps) {
  const onClick: MouseEventHandler = (event) => {
    event.stopPropagation();
    event.preventDefault();
    const wasFavorite =
      tmpFavorite.get(item.id) !== undefined
        ? tmpFavorite.get(item.id)
        : item.favorite;
    tmpFavorite.set(item.id, !wasFavorite);
    setTmpFavorite(new Map(tmpFavorite));
    autoCompleteProps.onFavoriteToggle?.(item, !wasFavorite);
  };
  const isTmpFavorite = tmpFavorite.get(item.id);
  const isFavorite =
    isTmpFavorite !== undefined ? isTmpFavorite : item.favorite;
  return (
    <div
      className={cn(
        'group',
        highlightedIndex === index && 'bg-gray-100 dark:bg-gray-700',
        selectedItem === item && 'font-bold',
        `${height} py-2 px-1 shadow-sm`,
        "before:content-['']"
      )}
      {...getItemProps({ item, index })}
    >
      <div className="flex justify-between px-1">
        <div>{item.title}</div>
        <StarIcon
          isSelected={isFavorite}
          className={isFavorite ? '' : 'invisible group-hover:visible'}
          onClick={onClick}
        />
      </div>
      <ShortcutLink {...autoCompleteProps} item={item} />
    </div>
  );
}

export interface ItemsSectionProps {
  items: Item[];
  highlightedIndex: number;
  selectedItem: Item | null;
  getItemProps: UseComboboxPropGetters<Item>['getItemProps'];
  autoCompleteProps: AutoCompleteProps;
  tmpFavorite: Map<string, boolean>;
  setTmpFavorite: (tmpFavorite: Map<string, boolean>) => void;
}

function ItemsSections({ items, ...rest }: ItemsSectionProps) {
  const itemsWithIndex = items.map((item, index) => ({ ...item, index }));

  const recentSection = itemsWithIndex.filter(
    (item) => item.recent && !item.favorite
  );
  const favSection = itemsWithIndex.filter((item) => item.favorite);
  const allSection = itemsWithIndex.filter(
    (item) => !item.favorite && !item.recent
  );

  return (
    <>
      {recentSection.length > 0 && (
        <Section title={'🕒 Recent'}>
          {recentSection.map((item) => (
            <ItemPrinter
              key={item.index}
              index={item.index}
              item={item}
              {...rest}
            />
          ))}
        </Section>
      )}
      {favSection.length > 0 && (
        <Section title={'⭐ Favorites'}>
          {favSection.map((item) => (
            <ItemPrinter
              key={item.index}
              index={item.index}
              item={item}
              {...rest}
            />
          ))}
        </Section>
      )}
      {allSection.length > 0 && (
        <Section title={'🗂️ All'}>
          {allSection.map((item) => (
            <ItemPrinter
              key={item.index}
              index={item.index}
              item={item}
              {...rest}
            />
          ))}
        </Section>
      )}
    </>
  );
}

export function EhAutoComplete(props: AutoCompleteProps) {
  const [items, setItems] = useState(props.itemsAll);
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
  } = useCombobox({
    onInputValueChange({ inputValue }) {
      setItems(props.filter(inputValue, props.itemsAll));
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
    },
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
    onClick: preselectAndShowAllOptions,
    onKeyDown: (event) => {
      if (event.ctrlKey && event.key === 'Enter') {
        props.onCtrlEnter?.();
      } else if (event.key === 'Enter' && isOpen && items.length === 1) {
        selectItem(items[0]);
        props.onSelectedItemChange(items[0].id);
      }
    }
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
            className={`w-full ${height} text-xl text-gray-500 rounded p-2`}
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
