export interface EhBackendUiDefaultsInput {
  credentialsRefs: Array<string>
}

export interface EhBackendCredentialInput {
  slug: string
  desc?: string
  username: string
  password: string
}
