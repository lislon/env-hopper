import { EhAppId, EhAppMeta, EhEnv, EhPageId, EhSubstitutionType } from '@env-hopper/types';
import { Jsonify } from './database/mappers';

export interface EhAppPageBackend {
  id: EhPageId;
  title: string;
  url: string
}

export interface EhAppBackend {
  id: EhAppId;
  title: string;
  abbr: string;
  aliases: string[];
  pages: EhAppPageBackend[];
  meta: EhAppMeta;
}

export type EhEnvDb = Jsonify<EhEnv, 'meta'>;
export type EhAppDb = Jsonify<EhAppBackend, 'aliases' | 'meta' | 'pages'>;
export type EhSubstitutionDb = EhSubstitutionType;
