export interface EhBackendGenericMetaInput {
  [key: string]: string | null | EhBackendGenericMetaInput;
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
