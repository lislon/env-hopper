import { EhApp, EhEnv, EhSubstitutionType } from '@env-hopper/types';
import { Jsonify } from './database/mappers';

export type EhEnvDb = Jsonify<EhEnv, 'meta'>;
export type EhAppDb = Jsonify<EhApp, 'urlPerEnv' | 'meta'>;
export type EhSubstitutionDb = EhSubstitutionType;
