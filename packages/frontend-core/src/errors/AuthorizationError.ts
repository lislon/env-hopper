/**
 * Custom error class for authorization failures
 * Stores information about required permissions and provides user-friendly messages
 */
export class AuthorizationError extends Error {
  public readonly requiredRoles?: Array<string>
  public readonly requiredPermissions?: Array<string>
  public readonly resource?: string

  constructor(options: {
    message?: string
    requiredRoles?: Array<string>
    requiredPermissions?: Array<string>
    resource?: string
  }) {
    const defaultMessage =
      options.message || 'You do not have permission to access this resource'
    super(defaultMessage)

    this.name = 'AuthorizationError'
    this.requiredRoles = options.requiredRoles
    this.requiredPermissions = options.requiredPermissions
    this.resource = options.resource
  }

  /**
   * Check if an error is an AuthorizationError
   */
  static isAuthorizationError(error: unknown): error is AuthorizationError {
    return error instanceof AuthorizationError
  }
}
