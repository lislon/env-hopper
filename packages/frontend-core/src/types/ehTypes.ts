import type { TRPCRouter, EnvBaseInfo } from '@env-hopper/backend-core'
import type { TRPCClient } from '@trpc/client'
import type { EhDb } from '~/userDb/EhDb'

// EhEnvIndexed is now imported from @env-hopper/backend-core as EnvBaseInfo
export type EhEnvIndexed = EnvBaseInfo

// EhAppIndexed is now imported from @env-hopper/backend-core

export interface EhAppPage {
  slug: string
  displayName: string
}

// Base interface for dropdown content components
export interface BaseDropdownContentProps {
  searchValue?: string
  onSelect?: (value: string) => void
  getMenuProps?: () => any
  getItemProps?: (options: any) => any
  highlightedIndex?: number
  isOpen?: boolean
  isUntouched: boolean
}

export interface EhUrlParams {
  envId?: string
  appId?: string
  subValue?: string
}

export interface DbAware {
  db: EhDb
}

export interface TrpcAware {
  trpcClient: TRPCClient<TRPCRouter>
}
