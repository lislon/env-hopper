/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import "express-async-errors";
import express from 'express';
import * as path from 'path';
import { publicApi } from './api/public-api';

const app = express();

const assets = process.env.ASSETS_DIR || path.join(__dirname, 'assets');
app.use('/', express.static(assets));

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to backend 2!' +  assets });
});

app.use(publicApi);

const port = process.env.PORT || 4001;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);
