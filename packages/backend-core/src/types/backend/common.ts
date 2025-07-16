export interface EhMetaDictionary {
  [key: string]: string | null | EhMetaDictionary;
}

export interface EhBackendUiDefaultsInput {
  credentialsRefs: string[];
}

export interface EhBackendCredentialInput {
  slug: string;
  desc?: string;
  username: string;
  password: string;
}
