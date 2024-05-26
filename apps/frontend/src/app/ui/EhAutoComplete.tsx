import React, { useRef, useState } from 'react';
import { useCombobox } from 'downshift';
import cn from 'classnames';
import { EhSubstitution } from '@env-hopper/types';


export interface Item {
  id: string;
  title: string;
}

export type EhAutoCompleteFilter = (inputValue: string) => (item: Item) => boolean;

export type OnSelectedItemChange = (item: string | null) => void;

export interface AutoCompleteProps {
  items: Item[];
  placeholder?: string;
  label?: string;
  filter: EhAutoCompleteFilter;
  onSelectedItemChange: OnSelectedItemChange;
  selectedItem: Item | null;
  itemMetaGenerator?: (id: string) => { link: string } | { substitutionTitle: string} | null;
  onClick?: (id: string) => void;
}

function generateLink(props: AutoCompleteProps, item: Item) {
  const meta = props.itemMetaGenerator?.(item.id) || null;
  if (meta === null) {
    return null
  }

  if ('link' in meta) {
    return <a href={meta.link}
              className="content-center p-1 hover:cursor-pointer"
              onClick={() => props.onClick?.(item.id)}
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
      {`#${meta.substitutionTitle}`}
    </button>;
  }

}


export function EhAutoComplete(props: AutoCompleteProps) {
  const [items, setItems] = useState(props.items);
  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    reset,
    selectedItem
  } = useCombobox({
    onInputValueChange({ inputValue }) {
      setItems(props.items.filter(props.filter(inputValue)));
      if (inputValue === '') {
        props.onSelectedItemChange(null);
      }
    },
    onSelectedItemChange({ selectedItem }) {
      props.onSelectedItemChange(selectedItem?.id || null);
    },
    selectedItem: props.selectedItem,
    items,
    itemToString(item) {
      return item ? item.title : '';
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  function preselectAndShowAllOptions() {
    inputRef.current?.select();
    setItems(props.items);
  }

  const inputProps = getInputProps({
    ref: inputRef,
    onFocus: preselectAndShowAllOptions,
    onClick: preselectAndShowAllOptions
  });
  return (
    <div>
      <div className="w-full flex flex-col gap-1">
        <label className="w-fit" {...getLabelProps()}>
          {props.label}
        </label>
        <div className="flex shadow-sm bg-black gap-0.5">
          <input
            placeholder={props.placeholder}
            className="w-full h-16 text-center text-2xl text-gray-500"
            {...inputProps}
          />
          <button
            aria-label="clear selection"
            className="px-2"
            type="button"
            onClick={() => {
              reset();
            }}
            tabIndex={-1}
          >
            &#215;
          </button>
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
      <div className="relative w-full">
        <ul
          className={cn(`w-full bg-gray-900 mt-1 shadow-md p-0 z-10 absolute max-h-80 overflow-y-scroll`,
            !(isOpen && items.length) && 'hidden')}
          {...getMenuProps()}
        >
          {isOpen &&
            items.slice(0, 10).map((item, index) => {
              return (
                <li
                  className={cn(
                    highlightedIndex === index && 'bg-gray-700',
                    selectedItem === item && 'font-bold',
                    'h-16 py-2 px-3 shadow-sm flex flex-row justify-between',
                    'grayscale hover:grayscale-0'
                  )}
                  key={item.id}
                  {...getItemProps({ item, index })}
                >
                  <span className="content-center">{item.title}</span>
                  {generateLink(props, item)}
                </li>
              );
            })}
        </ul>
      </div>

    </div>
  );
}
