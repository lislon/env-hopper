import express, { Request, Response, Router } from 'express';
import { dbEnvsGet, dbEnvsSet } from '../database/repo/envs';
import {
  EH_HEADER_APP_VERSION,
  EH_HEADER_USER_ID,
  EhClientConfig,
  EhCustomization,
  EhCustomPartUnstable,
  EhEnv,
  EhStatJump,
  EhSubstitutionType,
} from '@env-hopper/types';

import { dbAppsGet, dbAppsSet } from '../database/repo/apps';
import {
  dbSubstitutionsGet,
  dbSubstitutionsSet,
} from '../database/repo/substitutions';
import { EhAppBackend } from '../backend-types';
import { UiReaderMapper } from '../database/mappers';
import {
  dbCustomizationGet,
  dbCustomizationUpdate,
} from '../database/repo/customization';
import { dbStatsJumpInsert, dbStatsJumpsGet } from '../database/repo/stats';
import { StatsJump } from '@prisma/client';

export const publicApi = Router();

publicApi.use(express.json());
publicApi.use(express.raw({ type: '*/*', limit: '10mb' }));

publicApi.get(
  '/api/config',
  async (req: Request, res: Response<EhClientConfig>) => {
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.url} user=${req.headers[EH_HEADER_USER_ID]} v=${req.headers[EH_HEADER_APP_VERSION]}`,
    );

    res.send({
      substitutions: await dbSubstitutionsGet(),
      apps: (await dbAppsGet()).flatMap(UiReaderMapper.ehApp),
      envs: await dbEnvsGet(),
      appVersion: process.env['APP_VERSION'] || 'vlocal',
    });
  },
);

publicApi.get('/api/envs', async (req: Request, res: Response<EhEnv[]>) => {
  res.send(await dbEnvsGet());
});

publicApi.post(
  '/api/envs',
  async (req: Request<EhEnv[]>, res: Response<'OK'>) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

    await dbEnvsSet(req.body);
    res.send('OK');
  },
);

publicApi.get(
  '/api/apps',
  async (req: Request, res: Response<EhAppBackend[]>) => {
    res.send(await dbAppsGet());
  },
);

publicApi.post(
  '/api/apps',
  async (req: Request<EhAppBackend[]>, res: Response<'OK'>) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

    await dbAppsSet(req.body);
    res.send('OK');
  },
);

publicApi.get(
  '/api/substitutions',
  async (req: Request, res: Response<EhSubstitutionType[]>) => {
    res.send(await dbSubstitutionsGet());
  },
);

publicApi.post(
  '/api/substitutions',
  async (req: Request<EhSubstitutionType[]>, res: Response<'OK'>) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

    await dbSubstitutionsSet(req.body);
    res.send('OK');
  },
);

publicApi.get(
  '/api/customization',
  async (req: Request, res: Response<EhCustomization>) => {
    res.send(await dbCustomizationGet());
  },
);

publicApi.post(
  '/api/customization',
  async (req: Request<EhCustomPartUnstable>, res: Response<'OK'>) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

    await dbCustomizationUpdate({ custom: req.body });
    res.send('OK');
  },
);

publicApi.post(
  '/api/customization/unstable__footerHtml',
  async (req: Request<string>, res: Response<'OK'>) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

    await dbCustomizationUpdate({ footerHtml: req.body.toString('utf-8') });
    res.send('OK');
  },
);

publicApi.post(
  '/api/customization/unstable__analyticsScript',
  async (req: Request<string>, res: Response<'OK'>) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

    await dbCustomizationUpdate({
      analyticsScript: req.body.toString('utf-8'),
    });
    res.send('OK');
  },
);

publicApi.get('/api/stats/jump', async (req: Request<void>, res: Response) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  res.send(await dbStatsJumpsGet({ limit: +(req.query['limit'] || 10000) }));
});

publicApi.post(
  '/api/stats/jump',
  async (req: Request<EhStatJump>, res: Response<'OK'>) => {
    const dbEntry: Omit<StatsJump, 'id'> = {
      appVersion: req.headers[EH_HEADER_APP_VERSION] as string,
      appId: req.body.appId,
      envId: req.body.envId,
      jumpDate: req.body.date,
      createdAt: new Date().toISOString(),
      sub: req.body.sub || '',
      userId: req.headers[EH_HEADER_USER_ID] as string,
    };

    console.log(
      `${new Date().toISOString()} ${req.method} ${req.url} env=${dbEntry['envId']} app=${dbEntry['appId']}${dbEntry['sub'] ? `sub=${dbEntry['sub']} ` : ``} user=${req.headers[EH_HEADER_USER_ID]}`,
    );
    await dbStatsJumpInsert(dbEntry);
    res.send('OK');
  },
);
