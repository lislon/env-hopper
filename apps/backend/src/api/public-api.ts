import express, { Request, Response, Router } from 'express';
import { dbEnvsGet, dbEnvsSet } from '../database/repo/envs';
import { EhApp, EhClientConfig, EhEnv, EhSubstitution } from '@env-hopper/types';

import { dbAppsGet, dbAppsSet } from '../database/repo/apps';
import { dbSubstitutionsGet, dbSubstitutionsSet } from '../database/repo/substitutions';

export const publicApi = Router();

publicApi.use(express.json());


publicApi.get('/api/config', async (req: Request, res: Response<EhClientConfig>) => {
  res.send({
    substitutions: await dbSubstitutionsGet(),
    apps: await dbAppsGet(),
    envs: await dbEnvsGet(),
  });
});

publicApi.get('/api/envs', async (req: Request, res: Response<EhEnv[]>) => {
  res.send(await dbEnvsGet());
});

publicApi.post('/api/envs', async (req: Request<EhEnv[]>, res: Response<'OK'>) => {
  await dbEnvsSet(req.body);
  res.send('OK');
});

publicApi.get('/api/apps', async (req: Request, res: Response<EhApp[]>) => {
  res.send(await dbAppsGet());
});

publicApi.post('/api/apps', async (req: Request<EhApp[]>, res: Response<'OK'>) => {
  await dbAppsSet(req.body);
  res.send('OK');
});

publicApi.get('/api/substitutions', async (req: Request, res: Response<EhSubstitution[]>) => {
  res.send(await dbSubstitutionsGet());
});

publicApi.post('/api/substitutions', async (req: Request<EhSubstitution[]>, res: Response<'OK'>) => {
  await dbSubstitutionsSet(req.body);
  res.send('OK');
});
