/**
 * Get admin group names from environment variables
 * Default: env_hopper_ui_super_admins
 */
function getAdminGroupsFromEnv(): Array<string> {
  const adminGroups =
    import.meta.env.VITE_AUTH_ADMIN_GROUPS || 'env_hopper_ui_super_admins'
  return adminGroups
    .split(',')
    .map((g: string) => g.trim())
    .filter(Boolean)
}

/**
 * Extract groups from user object
 */
function getUserGroups(user: any): Array<string> {
  if (!user) {
    return []
  }

  // Check common locations for group information
  const groups =
    user.groups || // Standard "groups" claim
    user.env_hopper_groups || // Custom env_hopper_groups claim
    user.oktaGroups || // Okta-specific
    user.roles || // Some providers use "roles"
    []

  return Array.isArray(groups) ? groups : []
}

/**
 * Check if user is a member of any of the specified groups
 */
function isMemberOfAnyGroup(user: any, allowedGroups: Array<string>): boolean {
  const userGroups = getUserGroups(user)
  return allowedGroups.some((group) => userGroups.includes(group))
}

/**
 * Check if user has admin permissions
 */
export function isAdmin(user: any): boolean {
  if (!user) {
    return false
  }
  const adminGroups = getAdminGroupsFromEnv()
  return isMemberOfAnyGroup(user, adminGroups)
}
