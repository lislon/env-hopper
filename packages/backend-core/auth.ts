import type { BetterAuthOptions } from 'better-auth'

// This is used by the better-auth CLI to generate schema
// Default export required by better-auth CLI
export default {
  appName: 'EnvHopper',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-do-not-use-in-production',
  database: {
    type: 'prisma',
    provider: 'postgresql',
  },
  emailAndPassword: {
    enabled: true,
  },
} satisfies BetterAuthOptions
