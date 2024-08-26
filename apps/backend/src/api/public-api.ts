import express, { Request, Response, Router } from 'express';
import { dbEnvsGet, dbEnvsSet } from '../database/repo/envs';
import { EhClientConfig, EhEnv, EhSubstitutionType } from '@env-hopper/types';

import { dbAppsGet, dbAppsSet } from '../database/repo/apps';
import { dbSubstitutionsGet, dbSubstitutionsSet } from '../database/repo/substitutions';
import { EhAppBackend } from '../backend-types';
import { UiReaderMapper } from '../database/mappers';
import { dbCustomHtmlGet, dbCustomHtmlSet } from '../database/repo/customHtml';

export const publicApi = Router();

publicApi.use(express.json());
publicApi.use(express.raw({ type: '*/*', limit: '10mb' }));

publicApi.get(
  '/api/config',
  async (req: Request, res: Response<EhClientConfig>) => {
    res.send({
      substitutions: await dbSubstitutionsGet(),
      apps: (await dbAppsGet()).flatMap(UiReaderMapper.ehApp),
      envs: await dbEnvsGet(),
      appVersion: process.env['APP_VERSION'] || 'vlocal',
      customFooterHtml: await dbCustomHtmlGet(),
    });
  },
);

publicApi.get('/api/envs', async (req: Request, res: Response<EhEnv[]>) => {
  res.send(await dbEnvsGet());
});

publicApi.post(
  '/api/envs',
  async (req: Request<EhEnv[]>, res: Response<'OK'>) => {
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
    await dbSubstitutionsSet(req.body);
    res.send('OK');
  },
);

publicApi.get(
  '/api/customHtml',
  async (req: Request, res: Response<string>) => {
    res.send(await dbCustomHtmlGet());
  },
);

publicApi.post(
  '/api/customHtml',
  async (req: Request<string>, res: Response<'OK'>) => {
    await dbCustomHtmlSet(req.body.toString('utf-8'));
    res.send('OK');
  },
);
