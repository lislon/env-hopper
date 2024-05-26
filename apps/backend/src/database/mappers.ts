import { EhAppDb, EhEnvDb, EhSubstitutionDb } from '../backend-types';
import { EhApp, EhEnv, EhSubstitution } from '@env-hopper/types';

export type Jsonify<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? string : T[P];
};

export function jsonify<T, K extends keyof T>(data: T, jsonFields: K[]): Jsonify<T, K> {
  const result: Jsonify<T, K> = {} as Jsonify<T, K>;
  Object.keys(data).forEach((key) => {
    if (jsonFields.includes(key as K)) {
      result[key] = JSON.stringify(data[key]);
    } else {
      result[key] = data[key];
    }
  });
  return result;
}

export function dejsonify<T, K extends keyof T>(data: Jsonify<T, K>, jsonFields: K[]): T {
  const result: T = {} as T;
  Object.keys(data).forEach((key) => {
    if (jsonFields.includes(key as K)) {
      result[key] = JSON.parse(data[key]);
    } else {
      result[key] = data[key];
    }
  });
  return result;
}

export class Writer {
  public static ehApp(data: EhApp): EhAppDb {
    return jsonify({ urlPerEnv: {}, ...data}, ['urlPerEnv']);
  }

  public static ehEnv(data: EhEnv): EhEnvDb {
    return jsonify(data, ['meta']);
  }

  public static ehSubstitution(data: EhSubstitution): EhSubstitutionDb {
    return data;
  }

}

export class Reader {
  public static ehApp(app: EhAppDb): EhApp {
    return dejsonify(app, ['urlPerEnv']);
  }

  public static ehEnv(data: EhEnvDb): EhEnv {
    return dejsonify(data, ['meta']);
  }

  public static ehSubstitution(data: EhSubstitutionDb): EhSubstitution {
    return data;
  }
}
