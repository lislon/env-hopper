/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'express-async-errors';
import express from 'express';
import * as path from 'path';
import { publicApi } from './api/public-api';
import { loggerMiddleware } from './logger';

const app = express();
app.get('/health', (_, res) => {
  res.send('ok');
});
app.use(loggerMiddleware);
app.use(publicApi);

const assets = process.env['ASSETS_DIR'] || path.join(__dirname, 'assets');
app.use(
  '/',
  express.static(assets, {
    cacheControl: false,
  }),
);

const port = process.env['PORT'] || 4001;
const server = app.listen(port, () => {
  console.log(
    `Listening at http://localhost:${port} v${
      process.env['APP_VERSION'] || 'local'
    }`,
  );
});
server.on('error', console.error);
