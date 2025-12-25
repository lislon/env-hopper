import { AppWindowIcon, GlobeIcon, SearchIcon } from 'lucide-react'
import { use } from 'react'
import type { SearchMode } from './types'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command'
import { cn } from '~/lib/utils'
import { useQuickSeachLogic } from '~/modules/resourceJump/ui/cmdk/useQuickSeachLogic'
import { QuickSearchContext } from '~/modules/resourceJump/ui/cmdk/QuickSearchContext'

export interface QuickSearchProps {
}

export function QuickSearch() {

  const { onSelect, options } = useQuickSeachLogic()
  const ctx = use(QuickSearchContext)
  if (!ctx) {
    throw new Error(
      'useQuickSearchContext must be used within a QuickSearchProvider',
    )
  }
  const { open, onOpenChange, searchMode, setSeachMode, } = ctx;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      commandProps={{ vimBindings: true }}
      position="top"
    >
      <div className="flex p-3 gap-2 text-xs items-baseline">
        <div
          className={cn(
            'px-2 h-6 border border-dashed border-eh-app-foreground rounded-lg content-center text-center',
            searchMode === 'anything' ? 'bg-eh-app-foreground/10' : '',
          )}
          onClick={() => setSeachMode('anything')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === 'Enter' || e.key === ' ') && setSeachMode('anything')
          }
        >
          <SearchIcon className="inline w-3 h-3 mr-1" />
          Anything
        </div>
        <div
          className={cn(
            'px-2 h-6 border border-dashed border-eh-app-foreground rounded-lg content-center text-center',
            searchMode === 'app' ? 'bg-eh-app-foreground/10' : '',
          )}
          onClick={() => setSeachMode('app')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === 'Enter' || e.key === ' ') && setSeachMode('app')
          }
        >
          <AppWindowIcon className="inline w-3 h-3 mr-1" />
          App
        </div>
        <div
          className={cn(
            'px-2 h-6 border border-dashed border-eh-app-foreground rounded-lg content-center text-center',
            searchMode === 'env' ? 'bg-eh-app-foreground/10' : '',
          )}
          onClick={() => setSeachMode('env')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === 'Enter' || e.key === ' ') && setSeachMode('env')
          }
        >
          <GlobeIcon className="inline w-3 h-3 mr-1" />
          Env
        </div>
      </div>
      <CommandInput placeholder="Type a command or search..." autoFocus />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading={getHeading(searchMode)}>
          {options.map((f) => (
            <CommandItem key={f.slug} value={f.slug} onSelect={onSelect}>
              {f.displayName}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
      </CommandList>
    </CommandDialog>
  )
}
function getHeading(searchMode: SearchMode) {
  switch (searchMode) {
    case 'app':
      return 'Applications'
    case 'env':
      return 'Environments'
    case 'anything':
      return 'Anything'
  }
}
