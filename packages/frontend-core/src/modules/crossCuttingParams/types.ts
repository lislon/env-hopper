// Paramter that comes from URL
export interface CrossCuttingLoaderParam {
  slug: string
  stringValue: string
}

export interface CrossCuttingParamDef {
  slug: string
  displayName: string
  //   scope: 'global' | 'environment';
}

export interface CrossCuttingParamValue {
  slug: string
  stringValue: string
}

export const CROSS_CUTTING_SINGLE_SLUG = 'single'
