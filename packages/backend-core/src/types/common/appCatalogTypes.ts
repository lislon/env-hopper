/**
 * App Catalog Types - Universal Software Access Request Catalog
 *
 * These types define a standardized catalog of software applications and their
 * access methods. The typing system is designed to be universal across companies,
 * abstracting away specific tools (Jira, Slack, etc.) into generic categories.
 */

import type { AppAccessRequest, ApprovalMethod } from './approvalMethodTypes'

// ============================================================================
// APP CATALOG TYPES
// ============================================================================

/**
 * Application entry in the catalog
 */
export interface AppForCatalog {
  id: string
  slug: string
  displayName: string
  description?: string
  teams?: Array<string>
  accessRequest?: AppAccessRequest
  notes?: string
  tags?: Array<string>
  appUrl?: string
  links?: Array<{ url: string; title?: string }>
  iconName?: string // Optional icon identifier for display
  screenshotIds?: Array<string>
}

// Derived catalog data returned by backend
export interface AppCategory {
  id: string
  name: string
}

export interface GroupingTagDefinition {
  prefix: string
  displayName: string
  description: string
  values: Array<GroupingTagValue>
}

type DistributiveOmit<T, TKey extends keyof any> = T extends any
  ? Omit<T, TKey>
  : never

export type AppApprovalMethod = DistributiveOmit<
  ApprovalMethod,
  'createdAt' | 'updatedAt'
>

export interface GroupingTagValue {
  value: string
  displayName: string
  description: string
}

export interface AppCatalogData {
  apps: Array<AppForCatalog>
  tagsDefinitions: Array<GroupingTagDefinition>
  approvalMethods: Array<AppApprovalMethod>
}
