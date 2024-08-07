import { EhApp, EhAppId, EhEnv, EhEnvId, EhSubstitutionId, EhSubstitutionType } from '@env-hopper/types';
import { EhJumpHistory } from '../../types';

export const TestFeatureMagazine = {
  firstTimeUser: {
    isInitialState: true,
  },

  baseline: {
    isInitialState: false,
  },

  hasFavoriteApp: {
    hasFavoritesEnvs: true,
  },

  hasRecentJumps: {
    hasRecentJumps: true,
  },

  hasRecentAndFavoriteApp: {
    hasRecentJumps: true,
    hasFavoritesEnvs: true,
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
}

export interface TestFixtures {
  apps?: EhApp[];
  envs?: EhEnv[];
  substitutions?: EhSubstitutionType[]
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
    id: id,
    title: id,
    aliases: [],
    url:
      'https://{{' + ENV_SUBSTITUTION_VARIABLE + '}}.mycompany.com:8250/login',
    meta: undefined,
  };
}

export function testMagazineMakeFixtures(
  features: TestTrait = {},
): TestFixtures {
  let testFixtures: TestFixtures = {
    apps: [...['app1', 'app2'].map(testMakeApp), { ...testMakeApp('app3'), url: 'https://{{' + ENV_SUBSTITUTION_VARIABLE + '}}.mycompany.com:8250/{{namespace}}'}],
    envs: ['env1', 'env2', 'env3'].map(testMakeEnv),
    substitutions: [
      {
        id: 'namespace',
        title: 'Namespace',
      }
    ],
    favoriteApps: [],
    favoriteEnvs: [],
    recentJumps: [],
  };

  if (features.hasFavoritesEnvs) {
    testFixtures = { ...testFixtures, favoriteEnvs: ['env1'] };
  }
  if (features.hasFavoritesApps) {
    testFixtures = { ...testFixtures, favoriteApps: ['app1'] };
  }
  if (features.hasRecentJumps) {
    testFixtures = {
      ...testFixtures,
      recentJumps: [
        {
          app: 'app1',
          env: 'env1',
          url: 'https://env1.mycompany.com:8250/login',
        },
      ],
    };
  }

  return testFixtures;
}
