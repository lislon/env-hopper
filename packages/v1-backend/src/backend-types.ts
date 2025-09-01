import {
  EhAppId,
  EhAppMeta,
  EhAppWidgets,
  EhEnv,
  EhPageId,
  EhSubstitutionType,
} from '@env-hopper/types';
import { Jsonify } from './database/mappers';

export interface EhAppPageBackend {
  id: EhPageId;
  title: string;
  url: string;
}

export interface EhAppBackend {
  id: EhAppId;
  title: string;
  abbr: string;
  aliases: string[];
  pages: EhAppPageBackend[];
  meta: EhAppMeta;
  widgets?: EhAppWidgets;
}

export type EhEnvDb = Jsonify<EhEnv, 'meta' | 'appOverride'>;
export type EhAppDb = Jsonify<
  EhAppBackend,
  'aliases' | 'meta' | 'pages' | 'widgets'
>;
export type EhSubstitutionDb = EhSubstitutionType;
