import type { AutocompleteRootChangeEventDetails } from '@base-ui/react'
import type { EnvBaseInfo, TRPCRouter } from '@env-hopper/backend-core'
import type { QueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { TRPCClient } from '@trpc/client'
import { LayoutGrid, LayoutGridIcon } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { cn } from '~/lib/utils'
import {
    fuzzySearch,
    makeFuzzySearchIndex,
} from '~/modules/fuzzyMatchLogic/autoCompleteFilter'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { highlightText } from '~/modules/resourceJump/ui/cmdk/highlightText'
import { formatResourceTitle } from '~/modules/resourceJump/utils/helpers'
import {
    Autocomplete,
    AutocompleteClear,
    AutocompleteEmpty,
    AutocompleteInput,
    AutocompleteItem,
    AutocompleteList,
    AutocompletePopup,
    AutocompleteTrigger,
    AutocompleteValue,
} from '~/ui/autocomplete'
import { InputGroupAddon } from '~/ui/input-group'
import type { ResourceJumpLoaderReturn } from '../../types'

export interface ResourceJumpLayoutProps {
  children: React.ReactNode
  loaderData: ResourceJumpLoaderReturn
  queryClient: QueryClient
  trpcClient: TRPCClient<TRPCRouter>
}

function selectAll(e: React.FocusEvent<HTMLInputElement>) {
  e.target.select()
}

export function AppAutoComplete() {
  const { currentResourceJump, resourceJumps, setCurrentResourceJumpSlug } =
    useResourceJumpContext()
  // const { environments, currentResourceJump, setcurrentResourceJump } = useEnvironmentContext()
  const [searchValue, setSearchValue] = useState(
    currentResourceJump?.slug ?? '',
  )
  const searchIndex = useMemo(() => {
    return makeFuzzySearchIndex({
      entries: resourceJumps,
    })
  }, [resourceJumps])

  // const favoriteEnvs = useEnvStatistics();

  const [isPrestine, setPrestine] = useState(true)

  const filteredItems = useMemo(() => {
    // console.log({ isPrestine, searchValue, currentResourceJump: currentResourceJump?.displayName });

    const searchBy =
      isPrestine && currentResourceJump?.displayName === searchValue
        ? ''
        : searchValue
    return fuzzySearch(searchBy, {
      index: searchIndex,
      // freqGetter: (slug: string) => favoriteEnvs[slug] || 0,
    }).map((r) => r.entry)
  }, [isPrestine, currentResourceJump?.displayName, searchValue, searchIndex])

  const onValueChange = useCallback(
    (value: string, eventDetails: AutocompleteRootChangeEventDetails) => {
      setSearchValue(value)
      if (eventDetails.reason === 'input-change') {
        setPrestine(false)
      } else {
        const maybeFound = resourceJumps.find(
          (resJump) => resJump.displayName === value,
        )
        setCurrentResourceJumpSlug(maybeFound?.slug)
      }
    },
    [resourceJumps, setCurrentResourceJumpSlug],
  )

  const [open, setOpen] = useState(false)
  const scrollElementRef = useRef<HTMLDivElement | null>(null)

  const virtualizer = useVirtualizer({
    enabled: open,
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 32,
    overscan: 20,
    paddingStart: 8,
    paddingEnd: 8,
    scrollPaddingEnd: 8,
    scrollPaddingStart: 8,
  })
  const handleScrollElementRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element
      if (element) {
        virtualizer.measure()
      }
    },
    [virtualizer],
  )

  const totalSize = virtualizer.getTotalSize()

  return (
    <Autocomplete<EnvBaseInfo>
      items={resourceJumps}
      itemToStringValue={(v) => v.displayName}
      filteredItems={filteredItems}
      value={searchValue}
      onValueChange={onValueChange}
      openOnInputClick
      highlightItemOnHover
      autoHighlight
      keepHighlight
      limit={50}
      onOpenChange={(o) => {
        setPrestine(true)
        setOpen(o)
      }}
      open={open}
      onItemHighlighted={(item, { reason, index }) => {
        if (!item) {
          return
        }

        const isStart = index === 0
        const isEnd = index === filteredItems.length - 1
        const shouldScroll =
          reason === 'none' || (reason === 'keyboard' && (isStart || isEnd))
        if (shouldScroll) {
          queueMicrotask(() => {
            virtualizer.scrollToIndex(index, { align: isEnd ? 'start' : 'end' })
          })
        }
      }}
    >
      <label>
        Application
        <AutocompleteInput
          placeholder="Select Application..."
          propsGroup={{ className: 'border-eh-app-border' }}
          onFocus={selectAll}
        >
          <InputGroupAddon>
            <LayoutGridIcon className="stroke-eh-app-border" />
          </InputGroupAddon>
          <AutocompleteClear />
          <AutocompleteTrigger />
        </AutocompleteInput>
      </label>
      <AutocompletePopup>
        <AutocompleteEmpty>
          {' '}
          No results found for "{<AutocompleteValue />}"
        </AutocompleteEmpty>
        <AutocompleteList>
          {filteredItems.length > 0 && (
            <div
              role="presentation"
              ref={handleScrollElementRef}
              style={
                { '--total-size': `${totalSize}px` } as React.CSSProperties
              }
              className="box-border overflow-auto overscroll-contain scroll-py-2 h-[min(22rem,var(--total-size))] max-h-(--available-height)"
            >
              <div
                role="presentation"
                style={{ height: totalSize }}
                className="w-full relative"
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const item = filteredItems[virtualItem.index]
                  if (!item) {
                    return null
                  }

                  const maybeFound = resourceJumps.find(
                    (resJump) => resJump.slug === item.slug,
                  )

                  return (
                    <AutocompleteItem
                      key={virtualItem.key}
                      index={virtualItem.index}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      value={item}
                      aria-setsize={filteredItems.length}
                      aria-posinset={virtualItem.index + 1}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: virtualItem.size,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <div className="flex gap-2">
                        <div>
                          <LayoutGrid
                            className={cn('w-4', {
                              'stroke-eh-app-foreground':
                                item.slug === currentResourceJump?.slug,
                            })}
                          />
                        </div>
                        {highlightText(
                          formatResourceTitle(maybeFound),
                          searchValue,
                        )}
                      </div>
                    </AutocompleteItem>
                  )
                })}
              </div>
            </div>
          )}
        </AutocompleteList>
      </AutocompletePopup>
    </Autocomplete>
  )
}
