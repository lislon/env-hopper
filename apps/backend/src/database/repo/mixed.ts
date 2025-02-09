import { EhAppId, EhEnv, EhEnvId } from '@env-hopper/types';
import prisma from '../prisma';
import { DbReaderMapper } from '../mappers';
import { EhAppBackend } from '../../backend-types';

export interface EhEnvAndApp {
  app: EhAppBackend | undefined;
  env: EhEnv | undefined;
}

export async function dbGetEndAndApp({
  appId,
  envId,
}: {
  appId: EhAppId;
  envId: EhEnvId;
}): Promise<EhEnvAndApp> {
  const app = await prisma.application.findUnique({
    where: {
      id: appId,
    },
  });

  const env = await prisma.environment.findUnique({
    where: {
      id: envId,
    },
  });

  return {
    app: app ? DbReaderMapper.ehApp(app) : undefined,
    env: env ? DbReaderMapper.ehEnv(env) : undefined,
  };
}
