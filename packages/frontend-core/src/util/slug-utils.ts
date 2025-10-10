/**
 * Converts a URL slug to a human-readable display name
 * @param slug - The URL slug
 * @returns A formatted display name
 */
export function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Decodes a URL-encoded slug back to its original form
 * @param encodedSlug - The URL-encoded slug
 * @returns The decoded slug
 */
export function decodeSlug(encodedSlug: string): string {
  return decodeURIComponent(encodedSlug)
}
