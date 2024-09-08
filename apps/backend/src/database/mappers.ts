import {
  EhAppBackend,
  EhAppDb,
  EhEnvDb,
  EhSubstitutionDb,
} from '../backend-types';
import { EhApp, EhEnv, EhSubstitutionType } from '@env-hopper/types';
import { omit } from 'lodash';
import { formatAppTitle } from '../utils';

export type Jsonify<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? string : T[P];
};

export function jsonify<T, K extends keyof T>(
  data: T,
  jsonFields: K[],
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
  jsonFields: K[],
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

export class DbWriterMapper {
  public static ehApp(data: EhAppBackend): EhAppDb {
    return jsonify(data, ['meta', 'aliases', 'pages']);
  }

  public static ehEnv(data: EhEnv): EhEnvDb {
    return jsonify(data, ['meta']);
  }

  public static ehSubstitution(data: EhSubstitutionType): EhSubstitutionDb {
    return data;
  }
}

export class DbReaderMapper {
  public static ehApp(app: EhAppDb): EhAppBackend {
    return omit(dejsonify(app, ['aliases', 'meta', 'pages']), 'syntheticId');
  }

  public static ehEnv(data: EhEnvDb): EhEnv {
    return omit(dejsonify(data, ['meta']), 'syntheticId');
  }

  public static ehSubstitution(data: EhSubstitutionDb): EhSubstitutionType {
    return omit(data, 'syntheticId');
  }
}

export class UiReaderMapper {
  public static ehApp(app: EhAppBackend): EhApp[] {
    return app.pages.flatMap((page) => ({
      id: app.id + '/' + page.id,
      appTitle: app.title,
      title: formatAppTitle(app, page, app.pages.length === 1 ? '' : page.id),
      aliases: app.aliases,
      url: page.url,
      meta: app.meta,
    }));
  }
}
