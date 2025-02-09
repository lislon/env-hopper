import { useCombobox } from 'downshift';
import { useState } from 'react';
import cn from 'classnames';
import { log } from 'console';

export interface LabelComboBoxProps {
  initialLabels: string[];
  selectedLabel: string;
  onLabelSelect: (selectedItem: string) => void;
}

export function LabelComboBox({ initialLabels, selectedLabel, onLabelSelect }: LabelComboBoxProps) {
  const [labels, setLabels] = useState(initialLabels);

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
  } = useCombobox<string>({
    onInputValueChange({ inputValue, isOpen }) {
      setLabels(initialLabels.filter((l) => l.includes(inputValue)));
    },
    onSelectedItemChange({ selectedItem }) {
      onLabelSelect(selectedItem);
      // setLabelSelected(selectItem);
    },
    selectedItem: selectedLabel,
    items: labels,
  });

  const inputProps = getInputProps({});

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={'text'}
        className={'input input-bordered input-sm'}
        placeholder={'Label'}
      />
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
        {labels.length > 0 ? (
          labels.map((item: string, index: number) => {
            const { key, ...props } = getItemProps({
              key: item,
              index,
              item,
            });
            return (
              <li key={key} {...props}>
                <button
                  className={cn('w-full inline-block', {
                    focus: highlightedIndex === index,
                    active: selectedItem === item,
                  })}
                >
                  {item}
                </button>
              </li>
            );
          })
        ) : (
          <div className={'italic text-center p-2'}>
            No results for '{inputValue}'
          </div>
        )}
      </ul>
    </div>
  );
}
