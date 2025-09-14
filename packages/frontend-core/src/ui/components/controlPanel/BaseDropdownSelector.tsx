import React, { useState } from 'react'
import { useCombobox } from 'downshift'
import type { ReactNode } from 'react'
import type { BaseDropdownContentProps } from '~/types/ehTypes'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

interface BaseDropdownSelectorProps {
  value?: string
  placeholder: string
  onSelect: (value: string) => void
  children: (props: BaseDropdownContentProps) => ReactNode
  className?: string
}

interface DropdownInputProps {
  value?: string
  placeholder: string
  onSelect: (value: string) => void
  onClose: () => void
  children: (props: BaseDropdownContentProps) => ReactNode
  className?: string
}

function DropdownInput({
  value,
  placeholder,
  onSelect,
  onClose,
  children,
  className = '',
}: DropdownInputProps) {
  const [isUntouched, setIsUntouched] = useState(true)
  const [inputValue, setInputValue] = useState(value || '')

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
    // closeMenu,
  } = useCombobox({
    inputValue,
    isOpen: true, // Always open when this component is rendered
    onInputValueChange: ({ inputValue: newInputValue }) => {
      console.log('✏️ Input value changed:', newInputValue)
      setInputValue(newInputValue || '')
      setIsUntouched(false)
    },
    // onSelectedItemChange: ({ selectedItem: changedSelectedItem }) => {
    //   if (changedSelectedItem !== null) {
    //     console.log('✅ Item selected:', changedSelectedItem)
    //     onSelect(changedSelectedItem)
    //     closeMenu()
    //     onClose()
    //   }
    // },
    onIsOpenChange: ({ isOpen: newIsOpen }) => {
      console.log('📋 Combobox open change:', newIsOpen)
      if (newIsOpen === false) {
        console.log('📋 Combobox closed, closing dropdown')
        onClose()
      }
    },
    items: [], // We'll handle items in the children component
  })

  // Handle input blur
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    console.log('🔄 Input blur', {
      relatedTarget: e.relatedTarget,
      currentTarget: e.currentTarget,
      target: e.target,
    })
    // Let Downshift handle the blur behavior
  }

  // Handle input focus
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    console.log('🎯 Input focused', e.target)
  }

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
              console.log('✅ Child component selected:', selectedValue)
              onSelect(selectedValue)
              onClose()
            },
            getMenuProps,
            getItemProps,
            highlightedIndex,
            isOpen,
            isUntouched,
          })}
        </div>
      )}
    </div>
  )
}

export function BaseDropdownSelector({
  value,
  placeholder,
  onSelect,
  children,
  className = '',
}: BaseDropdownSelectorProps) {
  const [isInputMode, setIsInputMode] = useState(false)

  // Handle button click - switch to input mode
  const handleButtonClick = () => {
    console.log('🔘 Button clicked')
    setIsInputMode(true)
  }

  const handleClose = () => {
    setIsInputMode(false)
  }

  if (isInputMode) {
    return (
      <DropdownInput
        value={value}
        placeholder={placeholder}
        onSelect={onSelect}
        onClose={handleClose}
        className={className}
      >
        {children}
      </DropdownInput>
    )
  }

  return (
    <Button
      variant="ghost"
      size="default"
      className={`px-4 font-normal ${className} min-w-[15ch]`}
      onClick={handleButtonClick}
      type="button"
    >
      {value || placeholder}
    </Button>
  )
}
