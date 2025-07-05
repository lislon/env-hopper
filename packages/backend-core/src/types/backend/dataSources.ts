import { EhBackendGenericMetaInput } from './common';

export interface EhBackendDataSourceInputCommon {
  meta?: EhBackendGenericMetaInput;
}

export interface EhBackendDataSourceInputDb {
  slug?: string;
  type: 'db';
  url: string;
  username: string;
  password: string;
}

export interface EhBackendDataSourceInputKafka {
  slug?: string;
  type: 'kafka';
  topics: {
    consumer?: string[];
    producer?: string[];
  };
}

export type EhBackendDataSourceInput = EhBackendDataSourceInputCommon & (
  EhBackendDataSourceInputDb | EhBackendDataSourceInputKafka
);
