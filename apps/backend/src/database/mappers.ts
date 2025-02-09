import {
  EhAppBackend,
  EhAppDb,
  EhEnvDb,
  EhSubstitutionDb,
} from '../backend-types';
import { EhApp, EhEnv, EhSubstitutionType } from '@env-hopper/types';
import { omit } from 'lodash-es';

export type Jsonify<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? string : T[P];
};

type Identity<T> = { [P in keyof T]: T[P] };
export type AllowNulls<T, K extends keyof T> = Identity<
  Pick<T, Exclude<keyof T, K>> & {
    [P in K]: T[P] | null;
  }
>;

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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (data[key] !== undefined) {
        // @ts-expect-error quick dirty solution
        result[key] = JSON.parse(data[key]);
      }
    } else {
      // @ts-expect-error quick dirty solution
      result[key] = data[key];
    }
  });
  return result;
}

export class DbWriterMapper {
  public static ehApp(data: EhAppBackend): EhAppDb {
    return jsonify(data, ['meta', 'aliases', 'pages', 'widgets']);
  }

  public static ehEnv(data: EhEnv): EhEnvDb {
    return jsonify(data, ['meta', 'appOverride']);
  }

  public static ehSubstitution(data: EhSubstitutionType): EhSubstitutionDb {
    return data;
  }
}

export class DbReaderMapper {
  public static ehApp(app: AllowNulls<EhAppDb, 'widgets'>): EhAppBackend {
    const appNoNulls = { ...app, widgets: app.widgets ?? '[]' };

    return omit(
      dejsonify<EhAppBackend, 'aliases' | 'meta' | 'pages' | 'widgets'>(
        appNoNulls,
        ['aliases', 'meta', 'pages', 'widgets'],
      ),
      'syntheticId',
    );
  }

  public static ehEnv(
    data: AllowNulls<EhEnvDb, 'envType' | 'appOverride'>,
  ): EhEnv {
    const { envType, ...x } = data;
    const envNoNulls: EhEnvDb = {
      ...x,
      appOverride: x.appOverride ?? undefined,
      ...(envType === 'prod' ? { envType: 'prod' } : {}),
    };

    return omit(dejsonify(envNoNulls, ['meta', 'appOverride']), 'syntheticId');
  }

  public static ehSubstitution(data: EhSubstitutionDb): EhSubstitutionType {
    return omit(data, 'syntheticId');
  }
}

export class UiReaderMapper {
  public static ehApp(app: EhAppBackend): EhApp[] {
    return app.pages.flatMap((page) => {
      const needlePage = app.pages.length === 1 ? '' : page.id;
      return {
        id: app.id + '/' + page.id,
        appTitle: app.title,
        pageTitle: app.pages.find((p) => p.id === needlePage)?.title,
        abbr: app.abbr,
        aliases: app.aliases,
        url: page.url,
        meta: app.meta,
        widgets: app.widgets,
      };
    });
  }
}
