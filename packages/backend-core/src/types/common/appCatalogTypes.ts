export interface EhAppCatalogData {
    apps: EhAppCatalogDto[]
  }
  
  export interface EhAppCatalogDto {
    slug: string
    groups: EhAppCatalogGroupDto[]
  }
  
  export interface EhAppCatalogGroupDto {
    slug: string;
    displayName: string;
    pages: EhAppCatalogPageDto[];
  }
  
  export interface EhAppCatalogPageDto {
    slug: string;
    displayName: string;
  }

  