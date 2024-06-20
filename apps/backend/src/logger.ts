import { RequestHandler } from 'express';

export const loggerMiddleware: RequestHandler = (req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
};
