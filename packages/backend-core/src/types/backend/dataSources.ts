import type { EhMetaDictionary } from '../common/sharedTypes'

export interface EhBackendDataSourceInputCommon {
  meta?: EhMetaDictionary
}

export interface EhBackendDataSourceInputDb {
  slug?: string
  type: 'db'
  url: string
  username: string
  password: string
}

export interface EhBackendDataSourceInputKafka {
  slug?: string
  type: 'kafka'
  topics: {
    consumer?: Array<string>
    producer?: Array<string>
  }
}

export type EhBackendDataSourceInput = EhBackendDataSourceInputCommon &
  (EhBackendDataSourceInputDb | EhBackendDataSourceInputKafka)
