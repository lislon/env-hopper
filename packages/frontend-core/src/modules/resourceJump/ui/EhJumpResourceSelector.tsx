import { Popover, PopoverContent } from '@radix-ui/react-popover'
import { useCombobox } from 'downshift'
import { CornerDownRight, Edit3Icon, ExpandIcon, XIcon } from 'lucide-react'
import { unique } from 'radashi'
import React, { useEffect, useMemo } from 'react'
import { Button } from '~/components/ui/button'
import { PopoverTrigger } from '~/components/ui/popover'
import { cn } from '~/lib/utils'
import type {
  BaseAutoCompletableItem, BaseAutoCompleteItemRender
} from '~/modules/pluginCore/types'
import {
  autocompleteFilter,
  autocompleteToString,
  isAutocompleteItem,
} from '~/plugins/builtin/pageUrl/pageUrlAutoCompletePlugin'
import { highlightMatches } from '~/util/highlightMatches'
import { EhBaseSelectorRoot } from '../../../ui/components/commandInput/EhBaseSelector'
import type {
  AppAutoCompleteAmend,
  AutoCompleteContext,
} from '../../../ui/components/commandInput/types'
import { mapDisplayedItems } from '../helpers'
import { useResourceJumpContext } from '../ResourceJumpContext'

interface EhJumpResourceSelectorProps {
  className?: string
}

export function EhJumpResourceSelector({
  className = '',
}: EhJumpResourceSelectorProps) {
  const { jumpResources, currentResourceJump, setCurrentResourceJumpSlug } =
    useResourceJumpContext()

  const appFilter = (needle: string, allItems: Array<BaseAutoCompletableItem>) => {
    return autocompleteFilter(
      allItems.filter((i) => isAutocompleteItem(i)),
      needle,
    )
  }

  const [displayedItems, setDisplayedItems] =
    React.useState<Array<BaseAutoCompletableItem>>(jumpResources)

  const {
    isOpen: comboIsOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getToggleButtonProps,
    highlightedIndex,
    getItemProps,
    selectItem,
    selectedItem: comboSelectedItem,
    inputValue: comboInputValue,
    setInputValue,
  } = useCombobox<BaseAutoCompletableItem>({
    onInputValueChange({ inputValue: changedInputValue, isOpen: changedIsOpen }) {
      if (changedIsOpen) {
        const matchedIds = unique(appFilter(changedInputValue, jumpResources))
        setDisplayedItems(matchedIds)
      }
    },
    onSelectedItemChange({ selectedItem: changedSelectedItem }) {
      setCurrentResourceJumpSlug(changedSelectedItem?.slug)
    },
    // selectedItem,
    items: displayedItems,
    itemToString(item) {
      if (isAutocompleteItem(item)) {
        return autocompleteToString(item)
      }
      return 'n/a'
    },
  })

  useEffect(() => {
    if (currentResourceJump) {
      const f = jumpResources.find((e) => e.slug === currentResourceJump.slug)
      if (f) {
        selectItem(f)
      }
    }
  }, [currentResourceJump])

  const ctx = useMemo<AutoCompleteContext>(() => {
    return {
      searchString: comboInputValue,
    }
  }, [comboInputValue])

  return (
    <EhBaseSelectorRoot className={className}>
      <Popover open={comboIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative group hover:cursor-pointer w-full">
            <input
              className={cn(
                'text-xl h-14 w-full rounded-md border border-input bg-background px-4 py-4 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ',
                'group-hover:border-secondary-foreground/60 group-hover:bg-secondary/30 focus:bg-secondary/30 focus:border-secondary-foreground/60',
                'pr-12 hover:cursor-pointer',
              )}
              {...getInputProps({
                onMouseUp: (e) => {
                  const userHasSelectedSomeText =
                    e.currentTarget.selectionStart !==
                    e.currentTarget.selectionEnd
                  if (!userHasSelectedSomeText) {
                    // setInputValue('asdads')
                    e.currentTarget.select()
                  }
                },
                onKeyUp: (e) => {
                  if (e.key !== 'Enter') {
                    // console.log(e.target.value)
                    // setLastUsersInputText(e.target.value)
                  }
                },
              })}
            />
            {comboInputValue.length ? (
              <XIcon
                className="absolute right-5 top-1/2 -translate-y-1/2  stroke-secondary-foreground/50 group-hover:stroke-secondary-foreground/60 group-hover:rotate-3 group-hover:scale-95 hover:stroke-secondary-foreground hover:bg-secondary rounded-full"
                onClick={() => setInputValue('')}
              />
            ) : (
              <Edit3Icon
                {...getToggleButtonProps()}
                className="absolute right-5 top-1/2 -translate-y-1/2  stroke-secondary-foreground/50 group-hover:stroke-secondary-foreground/60 group-hover:rotate-3 group-hover:scale-95"
              />
            )}

            <label
              className={cn(
                'absolute text-sm text-secondary-foreground/50',
                'left-2 -top-0.5 -translate-y-1/2 text-muted-foreground bg-background rounded-2xl px-1',
              )}
              {...getLabelProps()}
            >
              Application
            </label>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className={cn(
            'w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)] bg-popover text-popover-foreground z-50 origin-(--radix-popover-content-transform-origin) rounded-b-md border shadow-md outline-hidden',
            { hidden: !comboIsOpen },
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
          forceMount
        >
          <div {...getMenuProps()} className="">
            {[...mapDisplayedItems(displayedItems)].map(
              ({ item, itemRenderData, isChild }, index) => {
                return (
                  <DisplayItem
                    key={item.slug}
                    ctx={ctx}
                    item={item}
                    itemRenderData={itemRenderData}
                    isChild={isChild}
                    selected={comboSelectedItem?.slug === item.slug}
                    highlighted={highlightedIndex === index}
                    getItemProps={getItemProps}
                  />
                )
              },
            )}
            {displayedItems.length === 0 && (
              <div className="text-secondary-foreground/50">
                '{comboInputValue}' not found. Try a different search.
              </div>
            )}
          </div>
          <div className="flex justify-end items-center p-1 bg-secondary/30 border-t">
            <Button className="h-1" variant="outline" size={'sm'}>
              All Apps (34) <ExpandIcon />
            </Button>
          </div>
        </PopoverContent>
        {/* </PopoverAnchor> */}
      </Popover>
    </EhBaseSelectorRoot>
  )
}

export interface DisplayItemProps
  extends React.ComponentPropsWithoutRef<'div'>,
    AppAutoCompleteAmend {
  item: BaseAutoCompletableItem
  itemRenderData: BaseAutoCompleteItemRender
  isChild?: boolean
  selected: boolean
  highlighted: boolean
  getItemProps: (props: { item: BaseAutoCompletableItem }) => any
  ctx: AutoCompleteContext
}

export function DisplayItem({
  item,
  itemRenderData,
  selected,
  isChild,
  highlighted,
  ctx,
  getItemProps,
  ...props
}: DisplayItemProps) {
  const { displayName, parentDisplayName, isDefaultGroupItem } = itemRenderData

  const content = () => {
    let finalStr = [parentDisplayName, isChild ? '-' : false, displayName]
      .filter(Boolean)
      .join(' / ')
    if (isDefaultGroupItem && parentDisplayName) {
      finalStr = parentDisplayName
    }
    if (isChild) {
      return (
        <div className="flex flex-row gap-1 items-center">
          <div className="text-secondary-foreground/50 pl-2">
            <CornerDownRight size={14} />
          </div>
          <div className="">
            {highlightMatches(displayName, ctx.searchString)}
          </div>
        </div>
      )
    }

    return highlightMatches(finalStr, ctx.searchString)
  }

  return (
    <div
      className={cn(
        'cursor-pointer text-secondary-foreground px-4 py-2 rounded-md',
        {
          'bg-accent': highlighted,
        },
      )}
      {...getItemProps({
        item,
      })}
      {...props}
    >
      {content()}
    </div>
  )
}
