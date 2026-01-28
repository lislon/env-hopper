import type { EhDevMockUser } from '../../middleware/types'
import type { User } from 'better-auth/types'

/**
 * Extended User type with env-hopper specific fields
 */
type EhUser = User & {
  env_hopper_groups?: Array<string>
}

/**
 * Creates a complete User object from basic dev mock user details
 */
export function createMockUserFromDevConfig(devUser: EhDevMockUser): EhUser {
  return {
    id: devUser.id,
    email: devUser.email,
    name: devUser.name,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    env_hopper_groups: devUser.groups,
  }
}

/**
 * Creates a mock session response for /api/auth/session endpoint
 */
export function createMockSessionResponse(devUser: EhDevMockUser) {
  return {
    user: {
      id: devUser.id,
      email: devUser.email,
      name: devUser.name,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      env_hopper_groups: devUser.groups,
    },
    session: {
      id: `${devUser.id}-session`,
      userId: devUser.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days
      token: `${devUser.id}-token`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }
}
