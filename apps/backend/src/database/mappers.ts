import { EhAppDb, EhEnvDb, EhSubstitutionDb } from '../backend-types';
import { EhApp, EhEnv, EhSubstitutionType } from '@env-hopper/types';

export type Jsonify<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? string : T[P];
};

export function jsonify<T, K extends keyof T>(
  data: T,
  jsonFields: K[]
): Jsonify<T, K> {
  const result: Jsonify<T, K> = {} as Jsonify<T, K>;
  // @ts-expect-error  quick dirty solution
  Object.keys(data).forEach((key) => {
    if (jsonFields.includes(key as K)) {
      // @ts-expect-error  quick dirty solution
      result[key] = JSON.stringify(data[key]);
    } else {
      // @ts-expect-error  quick dirty solution
      result[key] = data[key];
    }
  });
  return result;
}

export function dejsonify<T, K extends keyof T>(
  data: Jsonify<T, K>,
  jsonFields: K[]
): T {
  const result: T = {} as T;
  Object.keys(data).forEach((key) => {
    if (jsonFields.includes(key as K)) {
      // @ts-expect-error quick dirty solution
      result[key] = JSON.parse(data[key]);
    } else {
      // @ts-expect-error quick dirty solution
      result[key] = data[key];
    }
  });
  return result;
}

export class Writer {
  public static ehApp(data: EhApp): EhAppDb {
    // @ts-expect-error incoming data is not validated really
    return jsonify({ urlPerEnv: {}, ...data }, ['urlPerEnv', 'meta']);
  }

  public static ehEnv(data: EhEnv): EhEnvDb {
    return jsonify(data, ['meta']);
  }

  public static ehSubstitution(data: EhSubstitutionType): EhSubstitutionDb {
    return data;
  }
}

export class Reader {
  public static ehApp(app: EhAppDb): EhApp {
    return dejsonify(app, ['urlPerEnv', 'meta']);
  }

  public static ehEnv(data: EhEnvDb): EhEnv {
    return dejsonify(data, ['meta']);
  }

  public static ehSubstitution(data: EhSubstitutionDb): EhSubstitutionType {
    return data;
  }
}
