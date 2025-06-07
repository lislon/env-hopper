import { EhBackendApi, EhBackendAppInput, EhBackendContextInput, EhBackendEnvironmentInput } from './backendTypes';
import { miniDb } from './mini-db';

export const ehBackendApi: EhBackendApi = {

  updateAppsAndContexts: async (apps:  EhBackendAppInput[], ctxs:  EhBackendContextInput[]) => {
    await miniDb.set('apps', apps);
    await miniDb.set('ctx', ctxs);
  },

  updateEnvironments: async (environments: EhBackendEnvironmentInput[]) => {
    await miniDb.set('envs', environments);
  },
}
