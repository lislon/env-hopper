/**
 * Auth provider types and utilities
 *
 * Note: env-hopper backend-core does not read environment variables directly.
 * Auth configuration (providers, plugins, admin groups) should be passed via
 * middleware parameters by the client application.
 *
 * Example client-side configuration:
 *
 * ```typescript
 * import { genericOAuth, okta } from 'better-auth/plugins'
 *
 * const authConfig = {
 *   baseURL: process.env.BETTER_AUTH_URL,
 *   secret: process.env.BETTER_AUTH_SECRET,
 *   providers: {
 *     github: {
 *       clientId: process.env.AUTH_GITHUB_CLIENT_ID,
 *       clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
 *     },
 *     google: {
 *       clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
 *       clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
 *     },
 *   },
 *   plugins: [
 *     genericOAuth({
 *       config: [
 *         okta({
 *           clientId: process.env.AUTH_OKTA_CLIENT_ID,
 *           clientSecret: process.env.AUTH_OKTA_CLIENT_SECRET,
 *           issuer: process.env.AUTH_OKTA_ISSUER,
 *         }),
 *       ],
 *     }),
 *   ],
 *   adminGroups: ['env_hopper_ui_super_admins'],
 * }
 * ```
 */
