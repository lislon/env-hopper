export interface EhEnv {
  name: EhEnvId
  meta: Record<string, string>
}
export interface EhApp {
  name: EhAppId ;
  url: string
  urlPerEnv: Record<string, string>
}

export interface EhSubstitutionType {
    name: string
    title: string
}

export type EhSubstitutionValue = string;

export type EhEnvId = string;
export type EhAppId = string;
export type EhSubstitutionId = string;


export interface EhClientConfig {
  envs: EhEnv[]
  apps: EhApp[]
  substitutions: EhSubstitutionType[]
}
