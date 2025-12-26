import { createAuthClient } from 'better-auth/react'

/**
 * Better Auth client for frontend authentication
 * Automatically handles session management and cookies
 */
export const authClient = createAuthClient({
  baseURL: window.location.origin,
})
