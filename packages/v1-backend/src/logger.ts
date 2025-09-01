import { RequestHandler } from 'express';
import { EH_HEADER_USER_ID } from '@env-hopper/types';

export const loggerMiddleware: RequestHandler = (req, res, next) => {
  console.log(
    `${new Date().toISOString()} ${req.method} ${req.url} ${req.headers[EH_HEADER_USER_ID]}`,
  );
  next();
};
