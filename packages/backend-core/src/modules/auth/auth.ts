import type { BetterAuthOptions, BetterAuthPlugin } from 'better-auth'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { getDbClient } from '../../db'

export interface AuthConfig {
  appName?: string
  baseURL: string
  secret: string
  providers?: BetterAuthOptions['socialProviders']
  plugins?: Array<BetterAuthPlugin>
  /** Session expiration in seconds. Default: 7 days (604800) */
  sessionExpiresIn?: number
  /** Session update age in seconds. Default: 1 day (86400) */
  sessionUpdateAge?: number
}

export function createAuth(config: AuthConfig) {
  const prisma = getDbClient()
  const isProduction = process.env.NODE_ENV === 'production'

  const auth = betterAuth({
    appName: config.appName || 'EnvHopper',
    baseURL: config.baseURL,
    basePath: '/api/auth',
    secret: config.secret,
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    socialProviders: config.providers || {},
    plugins: config.plugins || [],
    emailAndPassword: {
      enabled: true,
    },
    session: {
      expiresIn: config.sessionExpiresIn ?? 60 * 60 * 24 * 30,
      updateAge: config.sessionUpdateAge ?? 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 300,
      },
    },
    advanced: {
      useSecureCookies: isProduction,
    },
  })

  return auth
}

export type BetterAuth = ReturnType<typeof createAuth>
