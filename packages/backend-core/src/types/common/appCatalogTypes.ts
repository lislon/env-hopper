export interface EhAppCatalogData {
  apps: Array<EhAppCatalogDto>
}

export interface EhAppCatalogDto {
  slug: string
  groups: Array<EhAppCatalogGroupDto>
}

export interface EhAppCatalogGroupDto {
  slug: string
  displayName: string
  pages: Array<EhAppCatalogPageDto>
}

export interface EhAppCatalogPageDto {
  slug: string
  displayName: string
}
