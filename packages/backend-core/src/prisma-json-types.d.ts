/* eslint-disable @typescript-eslint/consistent-type-imports */
/**
 * Prisma JSON Types Declaration
 *
 * This file provides type definitions for JSON fields in Prisma models.
 * The prisma-json-types-generator reads JSDoc comments like `/// [TypeName]`
 * on JSON fields and references them as `PrismaJson.TypeName`.
 *
 * We must declare these types in the global PrismaJson namespace for
 * TypeScript to properly infer types throughout the tRPC chain.
 *
 * @see https://github.com/arthurfiorette/prisma-json-types-generator
 */

declare global {
  namespace PrismaJson {
    // DbApprovalMethod.config - Type-specific configuration
    type ApprovalMethodConfig = import('./types/index').ApprovalMethodConfig

    // DbAppForCatalog.accessRequest - Per-app approval configuration
    type AppAccessRequest = import('./types/index').AppAccessRequest

    // DbAppForCatalog.links - Array of links
    interface AppLink {
      displayName?: string
      url: string
    }

    // AppRole used within accessRequest
    type AppRole = import('./types/index').AppRole
  }
}

export {}
