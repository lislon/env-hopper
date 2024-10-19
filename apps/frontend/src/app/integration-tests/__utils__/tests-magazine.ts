import {
  EhApp,
  EhAppId,
  EhEnv,
  EhEnvId,
  EhSubstitutionType,
} from '@env-hopper/types';
import { EhJumpHistory } from '../../types';
import { getAppIdByTitle, getEnvIdByTitle } from '../../lib/utils';

export const TestFeatureMagazine = {
  firstTimeUser: {
    isInitialState: true,
  },

  userNoOptions: {
    isInitialState: false,
  },

  hasFavoriteApp: {
    hasFavoritesEnvs: true,
  },

  hasRecentJumps: {
    hasRecentJumps: true,
  },

  hasRecentAndFavorites: {
    hasRecentJumps: true,
    hasFavoritesEnvs: true,
    hasFavoritesApps: true,
  },
} as const satisfies { [K in string]: TestTrait };

export interface TestTrait {
  isInitialState?: boolean;
  /**
   * env1 is favorite
   */
  hasFavoritesEnvs?: boolean;
  /**
   * app1 is favorite
   */
  hasFavoritesApps?: boolean;
  /**
   * app1 and env1 is recent jump
   */
  hasRecentJumps?: boolean;

  /**
   * Override default created envs
   */
  existingEnvs?: EhEnv[];
  existingApps?: EhApp[];
}

export interface TestFixtures {
  apps?: EhApp[];
  envs?: EhEnv[];
  substitutions?: EhSubstitutionType[];
  favoriteApps?: EhAppId[];
  favoriteEnvs?: EhEnvId[];
  recentJumps?: EhJumpHistory[];
}

const ENV_SUBSTITUTION_VARIABLE = 'env.id';

export function testMakeEnv(name: string): EhEnv {
  return {
    id: name,
    meta: {
      [ENV_SUBSTITUTION_VARIABLE]: name,
    },
  };
}

export function testMakeApp(id: string): EhApp {
  return {
    id: getAppIdByTitle(`${id}`),
    appTitle: id,
    pageTitle: undefined,
    abbr: undefined,
    aliases: [],
    url:
      'https://{{' +
      ENV_SUBSTITUTION_VARIABLE +
      `}}.mycompany.com:8250/${id}/login`,
    meta: undefined,
  };
}

export function testMagazineMakeFixtures(
  features: TestTrait = {},
): TestFixtures {
  const defaultEnvs = ['env1', 'env2', 'env3'].map(testMakeEnv);
  const defaultApps = [
    ...['app1', 'app2'].map(testMakeApp),
    {
      ...testMakeApp('app3-sub'),
      url:
        'https://{{' +
        ENV_SUBSTITUTION_VARIABLE +
        '}}.mycompany.com:8250/{{namespace}}',
    },
  ];

  let testFixtures: TestFixtures = {
    apps: features.existingApps ?? defaultApps,
    envs: features.existingEnvs ?? defaultEnvs,
    substitutions: [
      {
        id: 'namespace',
        title: 'Namespace',
      },
    ],
    favoriteApps: [],
    favoriteEnvs: [],
    recentJumps: [],
  };

  if (features.hasFavoritesEnvs) {
    testFixtures = {
      ...testFixtures,
      favoriteEnvs: ['env1'].map(getEnvIdByTitle),
    };
  }
  if (features.hasFavoritesApps) {
    testFixtures = {
      ...testFixtures,
      favoriteApps: ['app1'].map(getAppIdByTitle),
    };
  }
  if (features.hasRecentJumps) {
    testFixtures = {
      ...testFixtures,
      recentJumps: [
        {
          app: getAppIdByTitle('app1'),
          env: getEnvIdByTitle('env1'),
          url: 'https://env1.mycompany.com:8250/login',
        },
      ],
    };
  }

  return testFixtures;
}
