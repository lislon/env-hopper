/**
 * Auth provider configuration from environment variables
 * This is the recommended way to configure auth providers.
 *
 * Supports: GitHub, Google via environment variables
 * For Okta and other custom providers, use getAuthPluginsFromEnv()
 *
 * Example .env:
 * AUTH_GITHUB_CLIENT_ID=your_github_client_id
 * AUTH_GITHUB_CLIENT_SECRET=your_github_client_secret
 * AUTH_GOOGLE_CLIENT_ID=your_google_client_id
 * AUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
 */

import type { BetterAuthOptions, BetterAuthPlugin } from 'better-auth'
import { genericOAuth, okta } from 'better-auth/plugins'

export function getAuthProvidersFromEnv(): BetterAuthOptions['socialProviders'] {
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
 *
 * Note: If you get "User is not assigned to the client application" errors,
 * you need to configure your Okta application to allow all users:
 * 1. In Okta Admin Console, go to Applications → Your App
 * 2. Assignments tab → Assign to Groups → Add "Everyone" group
 * OR
 * 3. Edit the application → In "User consent" section, enable appropriate settings
 *
 * For group-based authorization:
 * 1. Add "groups" scope to your auth server policy rule
 * 2. Create a groups claim in your auth server
 * 3. Groups will be available in the user object after authentication
 */
export function getAuthPluginsFromEnv(): Array<BetterAuthPlugin> {
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
