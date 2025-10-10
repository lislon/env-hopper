import { Popover, PopoverContent } from '@radix-ui/react-popover'
import { useCombobox } from 'downshift'
import { Edit3Icon, XIcon } from 'lucide-react'
import { listify, unique } from 'radashi'
import React, { useEffect, useMemo } from 'react'
import { EhBaseSelectorRoot } from '~/ui/components/commandInput/EhBaseSelector'
import { PopoverTrigger } from '~/components/ui/popover'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'
import { cn } from '~/lib/utils'
import { useEnvironmentContext } from '~/modules/environment/EnvironmentContext'
import {
  fuzzySearch,
  makeFuzzySearchIndex,
} from '~/modules/fuzzyMatchLogic/autoCompleteFilter'

interface EhEnvSelectorProps {
  className?: string
}

export interface EhEnvSelectorItem {
  slug: string
  displayName: string
}

export function EhEnvSelector({ className = '' }: EhEnvSelectorProps) {
  const { envs } = useBootstrapConfig()
  const { currentEnv, setCurrentEnv } = useEnvironmentContext()

  const allItems = useMemo(
    () =>
      listify(envs, (_, e) => {
        return {
          slug: e.slug,
          displayName: e.displayName,
        }
      }),
    [envs],
  )

  const searchIndex = useMemo(() => {
    return makeFuzzySearchIndex({
      entries: allItems,
    })
  }, [allItems])

  const [displayedItems, setDisplayedItems] =
    React.useState<Array<EhEnvSelectorItem>>(allItems)

  const envFilter = (needle: string) => {
    if (needle.trim() === '') {
      return allItems
    }
    const newLocal = fuzzySearch(needle, {
      index: searchIndex,
    })
    console.log(needle, newLocal)

    return newLocal.map((e) => e.entry)
  }

  const {
    isOpen: comboIsOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getToggleButtonProps,
    highlightedIndex,
    getItemProps,
    selectItem,
    inputValue: comboInputValue,
    setInputValue,
  } = useCombobox<EhEnvSelectorItem>({
    onInputValueChange({
      inputValue: changedInputValue,
      isOpen: changedIsOpen,
    }) {
      if (changedIsOpen) {
        const matchedIds = unique(envFilter(changedInputValue))
        setDisplayedItems(matchedIds)
      }
    },
    onSelectedItemChange({ selectedItem: changedSelectedItem }) {
      setCurrentEnv(changedSelectedItem?.slug)
    },
    // selectedItem,
    items: displayedItems,
    itemToString(item) {
      return (item && item.displayName) || ''
    },
  })

  useEffect(() => {
    if (currentEnv) {
      const f = allItems.find((e) => e.slug === currentEnv.slug)
      if (f) {
        selectItem(f)
      }
    }
  }, [allItems, currentEnv, selectItem])

  return (
    <EhBaseSelectorRoot className={className}>
      <Popover open={comboIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative group hover:cursor-pointer w-full">
            <input
              className={cn(
                'text-xl h-14 w-full rounded-md border border-input bg-background px-4 py-4 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ',
                'group-hover:border-secondary-foreground/60 group-hover:bg-secondary/30 focus:bg-secondary/30 focus:border-secondary-foreground/60',
                'pr-12 hover:cursor-pointer duration-300',
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
              Environment
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
          <div {...getMenuProps()}>
            {displayedItems.map((item, index) => (
              <div
                key={item.slug}
                className={cn(
                  'cursor-pointer text-secondary-foreground px-3 py-3 rounded-md',
                  {
                    // 'bg-secondary/40': comboSelectedItem?.slug === item.slug,
                    'bg-primary/40': highlightedIndex === index,
                  },
                )}
                {...getItemProps({
                  item,
                })}
              >
                {item.displayName}
              </div>
            ))}
            {displayedItems.length === 0 && (
              <div className="text-secondary-foreground/50">
                '{comboInputValue}' not found. Try a different search.
              </div>
            )}
          </div>
        </PopoverContent>
        {/* </PopoverAnchor> */}
      </Popover>
    </EhBaseSelectorRoot>
  )
}
