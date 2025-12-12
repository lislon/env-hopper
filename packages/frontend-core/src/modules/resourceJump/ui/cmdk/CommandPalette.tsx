
import type { TRPCRouter } from '@env-hopper/backend-core';
import type { QueryClient } from '@tanstack/react-query';
import type { TRPCClient } from '@trpc/client';
import type { Keys } from 'react-hotkeys-hook';
import { useHotkeys } from 'react-hotkeys-hook';
import { ShortcutButton } from '~/components/ui/shortcut-button';
import { QuickSearch } from '~/modules/resourceJump/ui/cmdk/QuickSearch';
import {
  useQuickSearchContext
} from '~/modules/resourceJump/ui/cmdk/QuickSearchContext';
import type { ResourceJumpLoaderReturn } from '../../types';

export interface ResourceJumpLayoutProps {
  children: React.ReactNode
  loaderData: ResourceJumpLoaderReturn
  queryClient: QueryClient
  trpcClient: TRPCClient<TRPCRouter>
}

export interface CommandPaletteProps {
  label?: string
  cmd?: Keys
  shortcutKey?: string
  className?: string
}

export function CommandPalette({ label, shortcutKey, className  }: CommandPaletteProps) {
  const { openQuickSearch } = useQuickSearchContext()

  useHotkeys(shortcutKey !== undefined ? `ctrl+${shortcutKey}, cmd+${shortcutKey}` : '', (e) => {
    e.preventDefault()
    openQuickSearch({ searchMode: 'anything' })
  })

  return (
    <>
      <ShortcutButton
        text={label || 'Command Palette'}
        onClick={() => openQuickSearch({ searchMode: 'anything' })}
        shortcutKey={shortcutKey}
        className={className}
      />
      <QuickSearch />
    </>
  )
}
