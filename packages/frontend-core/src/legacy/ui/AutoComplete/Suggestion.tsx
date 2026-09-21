import cn from 'classnames'
import type { SourceItem } from './common'
import type { UseComboboxPropGetters } from 'downshift'
import type { EhAutoCompleteProps } from './EhAutoComplete'

export interface SuggestionProps {
  index: number
  item: SourceItem
  highlightedIndex: number
  selectedItem: SourceItem | null
  getItemProps: UseComboboxPropGetters<SourceItem>['getItemProps']
  autoCompleteProps: EhAutoCompleteProps
}

export function Suggestion({
  item,
  index,
  highlightedIndex,
  selectedItem,
  getItemProps,
}: SuggestionProps) {
  return (
    <li className={cn()} {...getItemProps({ item, index })}>
      <button
        className={cn('w-full inline-block', {
          focus: highlightedIndex === index,
          active: selectedItem?.id === item.id,
        })}
      >
        {item.title}
      </button>
    </li>
  )
}
