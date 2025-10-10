import type { SearchMode } from "~/modules/resourceJump/ui/cmdk/types";

export type SearchMode = 'anything' | 'app' | 'env'export interface QuickOption {
  slug: string
  displayName: string
  type: Omit<SearchMode, 'anything'>
}

