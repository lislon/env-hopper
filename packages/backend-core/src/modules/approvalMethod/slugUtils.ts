/**
 * Generates a URL-friendly slug from a display name.
 * Converts to lowercase and replaces non-alphanumeric characters with hyphens.
 *
 * @param displayName - The display name to convert
 * @returns A slug suitable for use as a primary key
 *
 * @example
 * generateSlugFromDisplayName("My Service") // "my-service"
 * generateSlugFromDisplayName("John's Team") // "john-s-team"
 */
export function generateSlugFromDisplayName(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
