/**
 * Auth provider configuration for backend-example
 * Configure identity providers via environment variables
 */

import type { BetterAuthOptions, BetterAuthPlugin } from 'better-auth'
import { genericOAuth, okta } from 'better-auth/plugins'

/**
 * Get OAuth provider configuration from environment variables
 * Supports: GitHub, Google
 *
 * Example .env:
 * AUTH_GITHUB_CLIENT_ID=your_github_client_id
 * AUTH_GITHUB_CLIENT_SECRET=your_github_client_secret
 * AUTH_GOOGLE_CLIENT_ID=your_google_client_id
 * AUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
 */
export function getAuthProviders(): BetterAuthOptions['socialProviders'] {
  const providers: BetterAuthOptions['socialProviders'] = {}

  // GitHub OAuth
  if (
    process.env.AUTH_GITHUB_CLIENT_ID &&
    process.env.AUTH_GITHUB_CLIENT_SECRET
  ) {
    providers.github = {
      clientId: process.env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
    }
  }

  // Google OAuth
  if (
    process.env.AUTH_GOOGLE_CLIENT_ID &&
    process.env.AUTH_GOOGLE_CLIENT_SECRET
  ) {
    providers.google = {
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
    }
  }

  return providers
}

/**
 * Get auth plugins from environment variables
 * Currently supports: Okta
 *
 * Example .env:
 * AUTH_OKTA_CLIENT_ID=your_okta_client_id
 * AUTH_OKTA_CLIENT_SECRET=your_okta_client_secret
 * AUTH_OKTA_ISSUER=https://your-org.okta.com/oauth2/ausxb83g4wY1x09ec0h7
 */
export function getAuthPlugins(): Array<BetterAuthPlugin> {
  const plugins: Array<BetterAuthPlugin> = []
  const oktaConfig: Array<ReturnType<typeof okta>> = []

  if (
    process.env.AUTH_OKTA_CLIENT_ID &&
    process.env.AUTH_OKTA_CLIENT_SECRET &&
    process.env.AUTH_OKTA_ISSUER
  ) {
    oktaConfig.push(
      okta({
        clientId: process.env.AUTH_OKTA_CLIENT_ID,
        clientSecret: process.env.AUTH_OKTA_CLIENT_SECRET,
        issuer: process.env.AUTH_OKTA_ISSUER,
      }),
    )
  }

  if (oktaConfig.length > 0) {
    plugins.push(genericOAuth({ config: oktaConfig }))
  }

  return plugins
}

/**
 * Get admin group names from environment variables
 * Default: ['env_hopper_ui_super_admins']
 */
export function getAdminGroups(): Array<string> {
  const adminGroups =
    process.env.AUTH_ADMIN_GROUPS || 'env_hopper_ui_super_admins'
  return adminGroups
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)
}

/**
 * Validate required auth environment variables
 */
export function validateAuthConfig(): void {
  const secret = process.env.BETTER_AUTH_SECRET
  const baseUrl = process.env.BETTER_AUTH_URL

  if (!secret) {
    console.warn(
      'BETTER_AUTH_SECRET not set. Using development fallback. Set this in production!',
    )
  }

  if (!baseUrl) {
    console.info('BETTER_AUTH_URL not set. Using default http://localhost:3000')
  }
}
