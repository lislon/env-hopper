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

    // DbAppForCatalog.access - Universal access method
    type AccessMethod = import('./types/index').AccessMethod

    // DbAppForCatalog.approvalDetails - Per-app approval configuration
    type AppApprovalDetails = import('./types/index').AppApprovalDetails

    // DbAppForCatalog.links - Array of links
    interface AppLink {
      displayName?: string
      url: string
    }

    // AppRole used within approvalDetails
    type AppRole = import('./types/index').AppRole
  }
}

export {}
