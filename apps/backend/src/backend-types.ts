import { EhApp, EhEnv, EhSubstitution } from '@env-hopper/types';
import { Jsonify } from './database/mappers';


export type EhEnvDb = Jsonify<EhEnv, 'meta'>;
export type EhAppDb = Jsonify<EhApp, 'urlPerEnv'>;
export type EhSubstitutionDb = EhSubstitution;

