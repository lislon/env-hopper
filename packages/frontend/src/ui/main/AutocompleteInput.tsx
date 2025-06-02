import React from 'react';
import { useCombobox } from 'downshift';
import FlexSearch from 'flexsearch';

const items = [
  'gspintegration-01',
  'LIMS',
  'Extranet',
  'Edit Organization Clinic',
  'Jump'
];

const index = new FlexSearch.Index();
items.forEach((item) => index.add(item, item));

export function AutocompleteInput() {
  const [inputItems, setInputItems] = React.useState(items);
  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex, 
  } = useCombobox({
    items: inputItems,
    onInputValueChange: ({ inputValue }) => {
      setInputItems(
        !inputValue
          ? items
          : index.search(inputValue).map((id) => id)
      );
    },
  });

  return (
    <div className="form-control w-full mb-4">
      <input
        className="input input-lg input-bordered w-full"
        placeholder="Search..."
        {...getInputProps()}
      />
      <ul
        {...getMenuProps()}
        className="menu bg-base-100 w-full mt-2 rounded-box shadow"
        style={{ display: isOpen && inputItems.length ? 'block' : 'none' }}
      >
        {isOpen &&
          inputItems.map((item, index) => (
            <li
              key={item}
              {...getItemProps({ item, index })}
              className={
                highlightedIndex === index ? 'active bg-primary text-primary-content' : ''
              }
            >
              {item}
            </li>
          ))}
      </ul>
    </div>
  );
} 