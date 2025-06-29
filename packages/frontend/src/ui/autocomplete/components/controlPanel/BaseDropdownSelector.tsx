import React, { useState, ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useCombobox } from 'downshift';

interface BaseDropdownSelectorProps {
  value?: string;
  placeholder: string;
  onSelect: (value: string) => void;
  children: (props: { 
    searchValue: string; 
    onSelect: (value: string) => void;
    getMenuProps: () => any;
    getItemProps: (options: any) => any;
    highlightedIndex: number;
    isOpen: boolean;
  }) => ReactNode;
  className?: string;
}

export function BaseDropdownSelector({
  value,
  placeholder,
  onSelect,
  children,
  className = "",
}: BaseDropdownSelectorProps) {
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
    openMenu,
    closeMenu,
  } = useCombobox({
    inputValue,
    onInputValueChange: ({ inputValue: newInputValue }) => {
      console.log("✏️ Input value changed:", newInputValue);
      setInputValue(newInputValue || "");
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        console.log("✅ Item selected:", selectedItem);
        onSelect(selectedItem);
        setIsInputMode(false);
        setInputValue("");
        closeMenu();
      }
    },
    onIsOpenChange: ({ isOpen: newIsOpen }) => {
      console.log("📋 Combobox open change:", newIsOpen);
      if (!newIsOpen && isInputMode) {
        console.log("📋 Combobox closed, switching back to button mode");
        setIsInputMode(false);
        setInputValue("");
      }
    },
    items: [], // We'll handle items in the children component
  });

  // Handle button click - switch to input mode
  const handleButtonClick = () => {
    console.log("🔘 Button clicked");
    setIsInputMode(true);
    setInputValue(value || "");
    openMenu();
  };

  // Handle input blur
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    console.log("🔄 Input blur", {
      relatedTarget: e.relatedTarget,
      currentTarget: e.currentTarget,
      target: e.target
    });
    // Let Downshift handle the blur behavior
  };

  // Handle input focus
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    console.log("🎯 Input focused", e.target);
  };

  if (isInputMode) {
    return (
      <div className="relative">
        <Input
          {...getInputProps({
            onBlur: handleInputBlur,
            onFocus: handleInputFocus,
            placeholder,
            className: `min-w-[200px] ${className}`,
            autoFocus: true,
          })}
        />
        {isOpen && (
          <div
            {...getMenuProps()}
            className="absolute top-full left-0 mt-1 min-w-[300px] bg-popover border border-border rounded-md shadow-md z-50"
          >
            {children({ 
              searchValue: inputValue, 
              onSelect: (selectedValue: string) => {
                console.log("✅ Child component selected:", selectedValue);
                onSelect(selectedValue);
                setIsInputMode(false);
                setInputValue("");
                closeMenu();
              },
              getMenuProps,
              getItemProps,
              highlightedIndex,
              isOpen,
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      {...getToggleButtonProps()}
      variant="ghost"
      size="default"
      className={`px-4 font-normal ${className} min-w-[15ch]`}
      onClick={handleButtonClick}
    >
      {value || placeholder}
    </Button>
  );
} 