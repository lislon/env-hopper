export interface EhAppLinkType {
  typeId: string;
  iconId: string;
  title: string;
  urlDecoded: string;
}

export interface EhEnvDto {
  slug: string
  displayName: string;
}

export interface EhAppDto {
  slug: string
  displayName: string;
}

// const packedId = (appId << 16) + envId;
export type EhAppEnvLinkPacked = number;

export interface EhEnvsAndAppsDto {
  envs: EhEnvDto[]
  apps: EhAppDto[]
  envsXApps: EhAppEnvLinkPacked;
}

