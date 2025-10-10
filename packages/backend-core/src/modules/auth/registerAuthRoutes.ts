import { toNodeHandler } from 'better-auth/node'
import type { Express, Request, Response } from 'express'
import type { BetterAuth } from './auth'

/**
 * Register Better Auth routes with Express
 * @param app - Express application instance
 * @param auth - Better Auth instance
 */
export function registerAuthRoutes(app: Express, auth: BetterAuth) {
  // Explicit session endpoint handler
  // Better Auth's toNodeHandler doesn't expose a direct /session endpoint
  app.get('/api/auth/session', async (req: Request, res: Response) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers as HeadersInit,
      })
      if (session) {
        res.json(session)
      } else {
        res.status(401).json({ error: 'Not authenticated' })
      }
    } catch (error) {
      console.error('[Auth Session Error]', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Use toNodeHandler to adapt better-auth for Express/Node.js
  // Express v5 wildcard syntax: /{*any} (also works with Express v4)
  const authHandler = toNodeHandler(auth)
  app.all('/api/auth/{*any}', authHandler)
}
