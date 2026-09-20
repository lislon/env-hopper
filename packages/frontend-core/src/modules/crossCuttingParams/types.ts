// Paramter that comes from URL
export interface CrossCuttingLoaderParam {
  slug: string
  stringValue: string
}

export interface CrossCuttingParamDef {
  slug: string
  displayName: string
  /** The value survives an environment switch. Defaults to false. */
  isSharedAcrossEnvs?: boolean
  /** The browser may suggest the user's earlier values. Defaults to false. */
  isBrowserAutocomplete?: boolean
}

export interface CrossCuttingParamValue {
  slug: string
  stringValue: string
}

export const CROSS_CUTTING_SINGLE_SLUG = 'single'
