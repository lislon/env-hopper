/**
 * Auth provider configuration for backend-example
 * Configure identity providers via environment variables
 */

import type { BetterAuthOptions } from 'better-auth'

/**
 * Get OAuth provider configuration from environment variables
 * Supports: GitHub, Google, and Okta OIDC
 *
 * Example .env:
 * AUTH_GITHUB_CLIENT_ID=your_github_client_id
 * AUTH_GITHUB_CLIENT_SECRET=your_github_client_secret
 * AUTH_GOOGLE_CLIENT_ID=your_google_client_id
 * AUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
 * AUTH_OKTA_CLIENT_ID=your_okta_client_id
 * AUTH_OKTA_CLIENT_SECRET=your_okta_client_secret
 * AUTH_OKTA_ISSUER=https://your-org.okta.com
 */
export function getAuthProviders(): BetterAuthOptions['socialProviders'] {
  const providers: BetterAuthOptions['socialProviders'] = {}

  // GitHub OAuth
  if (process.env.AUTH_GITHUB_CLIENT_ID && process.env.AUTH_GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: process.env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
    }
  }

  // Google OAuth
  if (process.env.AUTH_GOOGLE_CLIENT_ID && process.env.AUTH_GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
    }
  }

  // Okta OIDC
  if (
    process.env.AUTH_OKTA_CLIENT_ID &&
    process.env.AUTH_OKTA_CLIENT_SECRET &&
    process.env.AUTH_OKTA_ISSUER
  ) {
    // Okta uses OIDC (OpenID Connect) protocol
    // better-auth supports Okta as a built-in provider
    providers.okta = {
      clientId: process.env.AUTH_OKTA_CLIENT_ID,
      clientSecret: process.env.AUTH_OKTA_CLIENT_SECRET,
      issuer: process.env.AUTH_OKTA_ISSUER,
    }
  }

  return providers
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
