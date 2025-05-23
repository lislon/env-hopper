/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'express-async-errors';
import express, { RequestHandler } from 'express';
import * as path from 'path';
import { publicApi } from './api/public-api';

const app = express();
app.get('/health', (_, res) => {
  res.send('ok');
});
app.use(publicApi);

const assets = process.env['ASSETS_DIR'] || path.join(__dirname, 'assets');

app.use(
  '/',
  express.static(assets, {
    cacheControl: false,
  }),
);

const indexHtml: RequestHandler = (_, res) =>
  res.sendFile(path.resolve(assets, 'index.html'));
app.get('/app/*', indexHtml);
app.get('/env/*', indexHtml);

const port = process.env['PORT'] || 4001;
const server = app.listen(port, () => {
  console.log(
    `Listening at http://localhost:${port} v${
      process.env['APP_VERSION'] || 'local'
    }`,
  );
});
server.on('error', console.error);

const cleanup = (code: number | null) => {
  console.log('server process cleanup');
  server.close();
  process.exit(code ?? 0);
};

process.on('exit', (code) => cleanup(code));
// callback value is signal string, exit with 0
process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));
