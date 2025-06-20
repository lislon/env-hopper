import React, { useEffect, useState, useRef } from 'react';
import { useCombobox } from 'downshift';
import FlexSearch from 'flexsearch';

// Mocked hierarchical data: envs -> apps -> pages/topics
const mockData = {
  'cross-04': {
    apps: {
      'Prod-LIMS': ['Order Form', 'Invoices', 'Logs'],
      'Kafka': ['new.orders', 'order.updates', 'system.events'],
    }
  },
  'cross-05': {
    apps: {
      'Dev-Portal': ['Dashboard', 'Settings'],
      'Kafka': ['dev.events', 'alerts'],
    }
  },
};

export function AutocompleteInput() {
  // Build search index
  const [index] = useState(() => new FlexSearch.Index({ tokenize: 'forward', cache: true }));
  const [allItems, setAllItems] = useState<string[]>([]);

  // Flattened items for FlexSearch: "env > app > page"
  useEffect(() => {
    const items: string[] = [];
    Object.entries(mockData).forEach(([env, { apps }]) => {
      Object.entries(apps).forEach(([app, pages]) => {
        pages.forEach(page => {
          const label = `${env} > ${app} > ${page}`;
          items.push(label);
          index.add(label, label);
        });
      });
    });
    setAllItems(items);
  }, []);

  const {
    isOpen,
    getInputProps,
    getMenuProps,
    getItemProps,
    highlightedIndex,
    selectItem,
    inputValue
  } = useCombobox({
    items: allItems,
    onInputValueChange: ({ inputValue }) => {
      if (inputValue) {
        const results = index.search(inputValue);
        setFiltered(items => results);
      } else {
        setFiltered(allItems);
      }
    },
    onSelectedItemChange: ({ selectedItem }) => console.log('Navigate to:', selectedItem),
  });

  const [filtered, setFiltered] = useState(allItems);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="input-group">
        <button className="btn btn-outline">▾</button>
        <input
          {...getInputProps({
            placeholder: 'Type env, app, or page...',
            className: 'input input-bordered flex-1'
          })}
        />
      </div>
      <ul
        {...getMenuProps()}
        className={`dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full mt-1 ${isOpen ? 'block' : 'hidden'}`}
      >
        {isOpen && filtered.map((item, index) => (
          <li
            key={item}
            {...getItemProps({ item, index })}
            className={`${highlightedIndex === index ? 'bg-primary text-primary-content' : ''}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
