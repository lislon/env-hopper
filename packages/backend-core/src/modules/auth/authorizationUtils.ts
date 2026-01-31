/**
 * Authorization utilities for checking user permissions based on groups
 *
 * Groups are automatically included in the user session when:
 * 1. Okta auth server has a "groups" claim configured
 * 2. The auth policy rule includes "groups" in scope_whitelist
 *
 * Example usage in tRPC procedures:
 * ```typescript
 * myProcedure: protectedProcedure.query(async ({ ctx }) => {
 *   if (requireAdmin(ctx.user)) {
 *     // Admin-only logic
 *   }
 *   // Regular user logic
 * })
 * ```
 */

export interface UserWithGroups {
  id: string
  email: string
  name?: string
  // Groups from Okta (or other identity provider)
  // This will be populated if groups claim is configured
  [key: string]: any
}

/**
 * Extract groups from user object
 * Groups can be stored in different locations depending on the OAuth provider
 */
export function getUserGroups(
  user: UserWithGroups | null | undefined,
): Array<string> {
  if (!user) {
    return []
  }

  // Check common locations for group information
  const groups =
    user.groups || // Standard "groups" claim
    (user as any).env_hopper_groups || // Custom env_hopper_groups claim
    (user as any).oktaGroups || // Okta-specific
    (user as any).roles || // Some providers use "roles"
    []

  return Array.isArray(groups) ? groups : []
}

/**
 * Check if user is a member of any of the specified groups
 */
export function isMemberOfAnyGroup(
  user: UserWithGroups | null | undefined,
  allowedGroups: Array<string>,
): boolean {
  const userGroups = getUserGroups(user)
  return allowedGroups.some((group) => userGroups.includes(group))
}

/**
 * Check if user is a member of all specified groups
 */
export function isMemberOfAllGroups(
  user: UserWithGroups | null | undefined,
  requiredGroups: Array<string>,
): boolean {
  const userGroups = getUserGroups(user)
  return requiredGroups.every((group) => userGroups.includes(group))
}

/**
 * Check if user has admin permissions
 * @param user User object with groups
 * @param adminGroups List of admin group names (default: ['env_hopper_ui_super_admins'])
 */
export function isAdmin(
  user: UserWithGroups | null | undefined,
  adminGroups: Array<string> = ['env_hopper_ui_super_admins'],
): boolean {
  return isMemberOfAnyGroup(user, adminGroups)
}

/**
 * Require admin permissions - throws error if not admin
 * @param user User object with groups
 * @param adminGroups List of admin group names (default: ['env_hopper_ui_super_admins'])
 */
export function requireAdmin(
  user: UserWithGroups | null | undefined,
  adminGroups: Array<string> = ['env_hopper_ui_super_admins'],
): void {
  if (!isAdmin(user, adminGroups)) {
    throw new Error('Forbidden: Admin access required')
  }
}

/**
 * Require membership in specific groups - throws error if not member
 */
export function requireGroups(
  user: UserWithGroups | null | undefined,
  groups: Array<string>,
): void {
  if (!isMemberOfAnyGroup(user, groups)) {
    throw new Error(
      `Forbidden: Membership in one of these groups required: ${groups.join(', ')}`,
    )
  }
}
