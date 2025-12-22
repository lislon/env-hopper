import type { ReactNode } from 'react'
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState
} from 'react'
import type { SearchMode } from '~/modules/resourceJump/ui/cmdk/types'

export interface QuickSearchContextIface {
  openQuickSearch: ({ searchMode }: { searchMode: SearchMode}) => void
}

export interface QuickSearchContextPrivateIface extends QuickSearchContextIface {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchMode: SearchMode
  setSeachMode: (mode: SearchMode) => void
}

export const QuickSearchContext = createContext<
  QuickSearchContextPrivateIface | undefined
>(undefined)

interface QuickSearchProviderProps {
  children: ReactNode
}

export function QuickSearchProvider({
  children,
}: QuickSearchProviderProps) {

  const [open, onOpenChange] = useState(false)
  const [searchMode, setSeachMode] = useState<SearchMode>('anything')

  const openQuickSearch = useCallback(
    ({ searchMode: mode }: { searchMode: SearchMode}) => {
      setSeachMode(mode)
      onOpenChange(true)
    },
    [],
  )


  const value: QuickSearchContextPrivateIface = useMemo(
    () => ({
      open,
      onOpenChange,
      openQuickSearch,
      searchMode,
      setSeachMode,
    }),
    [open, openQuickSearch, searchMode],
  )

  return <QuickSearchContext value={value}>{children}</QuickSearchContext>
}

export function useQuickSearchContext(): QuickSearchContextIface {
  const context = use(QuickSearchContext)
  if (context === undefined) {
    throw new Error(
      'useQuickSearchContextmust be used within an QuickSearchContextIface',
    )
  }
  return context
}


