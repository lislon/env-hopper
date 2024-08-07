import { EhApp, EhAppId, EhEnv, EhEnvId } from '@env-hopper/types';
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
  favoriteApps?: EhAppId[];
  favoriteEnvs?: EhEnvId[];
  recentJumps?: EhJumpHistory[];
}

export function testMakeEnv(name: string): EhEnv {
  return {
    name: name,
    meta: {
      subdomain: name,
    },
  };
}

export function testMakeApp(name: string): EhApp {
  return {
    name: name,
    url: 'https://{subdomain}.mycompany.com:8250/login',
    meta: undefined,
    urlPerEnv: {},
  };
}

export function testMagazineMakeFixtures(
  features: TestTrait = {}
): TestFixtures {
  let testFixtures: TestFixtures = {
    apps: ['app1', 'app2', 'app3', 'app4'].map(testMakeApp),
    envs: ['env1', 'env2', 'env3', 'env4'].map(testMakeEnv),
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
