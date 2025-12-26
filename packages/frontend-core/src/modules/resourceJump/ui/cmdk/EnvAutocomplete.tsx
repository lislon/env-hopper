import type { AutocompleteRootChangeEventDetails } from '@base-ui/react'
import type { EnvBaseInfo, TRPCRouter } from '@env-hopper/backend-core'
import type { QueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { TRPCClient } from '@trpc/client'
import { EarthIcon } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { cn } from '~/lib/utils'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import {
    fuzzySearch,
    makeFuzzySearchIndex,
} from '~/modules/fuzzyMatchLogic/autoCompleteFilter'
import { ApiQueryMagazineResourceJump } from '~/modules/resourceJump/api/ApiQueryMagazineResourceJump'
import { highlightText } from '~/modules/resourceJump/ui/cmdk/highlightText'
import { useEnvStatistics } from '~/modules/resourceJump/utils/statistics/useEnvStatistics'
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

export function EnvAutoComplete() {
  const { environments, currentEnv, setCurrentEnv } = useEnvironmentContext()
  const { data: envExtended } = useQuery(
    ApiQueryMagazineResourceJump.getResourceJumpsExtended(),
  )

  const [searchValue, setSearchValue] = useState(currentEnv?.slug ?? '')
  const searchIndex = useMemo(() => {
    return makeFuzzySearchIndex({
      entries: environments,
    })
  }, [environments])

  const favoriteEnvs = useEnvStatistics()

  const [isPrestine, setPrestine] = useState(true)

  const filteredItems = useMemo(() => {
    // console.log({ isPrestine, searchValue, currentEnv: currentEnv?.displayName });

    const searchBy =
      isPrestine && currentEnv?.displayName === searchValue ? '' : searchValue
    return fuzzySearch(searchBy, {
      index: searchIndex,
      freqGetter: (slug: string) => favoriteEnvs[slug] || 0,
    }).map((r) => r.entry)
  }, [
    isPrestine,
    currentEnv?.displayName,
    searchValue,
    searchIndex,
    favoriteEnvs,
  ])

  const onValueChange = useCallback(
    (value: string, eventDetails: AutocompleteRootChangeEventDetails) => {
      setSearchValue(value)
      if (eventDetails.reason === 'input-change') {
        setPrestine(false)
      } else {
        const maybeFound = environments.find((env) => env.displayName === value)
        setCurrentEnv(maybeFound?.slug)
      }
    },
    [environments, setCurrentEnv],
  )

  const [open, setOpen] = useState(false)
  const scrollElementRef = useRef<HTMLDivElement | null>(null)

  const virtualizer = useVirtualizer({
    enabled: open,
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 32 + 16 + 8,
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
      items={environments}
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
        Environment
        <AutocompleteInput
          placeholder="Select Environment..."
          propsGroup={{ className: 'border-eh-env-border' }}
          onFocus={selectAll}
        >
          <InputGroupAddon>
            <EarthIcon className="stroke-eh-env-border" />
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

                  const maybeExt = envExtended?.envs.find(
                    (e) => e.slug === item.slug,
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
                          <EarthIcon
                            className={cn('w-4', {
                              'stroke-eh-env-foreground':
                                item.slug === currentEnv?.slug,
                            })}
                          />
                        </div>
                        <div className="flex gap-0.5 flex-col">
                          {highlightText(item.displayName, searchValue)}
                          <div className="text-xs text-muted-foreground">
                            {maybeExt?.description || 'Lisa'}
                          </div>
                        </div>
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
