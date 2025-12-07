import type { ResourceJump } from "@env-hopper/backend-core"
import type { CrossCuttingLoaderParam } from "~/modules/crossCuttingParams/types"
import type { FlagshipResourceJumpUi as FlagshipResourceJumpUI } from "~/modules/resourceJump/utils/mapToFlagshipResourceJumps"

export interface ResourceJumpItemParent {
  type: string
  displayName: string
  hasSingleChild: boolean
}

export interface ResourceJumpItem {
  type: string
  slug: string
  parent?: ResourceJumpItemParent
}

export interface ResourceJumpLoaderReturn {
  envSlug?: string
  resourceSlug?: string
  subValue?: string
  crossCuttingParams: Array<CrossCuttingLoaderParam>
}


export interface ResourceJumpHistoryItem {
  type: 'switch-selector' | 'external-jump';
  flagmanSlug?: string
  resourceSlug?: string
  envSlug?: string
  timestamp: number
}

export interface ResourceJumpUI extends ResourceJump {
  flagship: FlagshipResourceJumpUI;
}