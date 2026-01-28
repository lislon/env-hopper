/**
 * App Catalog Types - Universal Software Access Request Catalog
 *
 * These types define a standardized catalog of software applications and their
 * access methods. The typing system is designed to be universal across companies,
 * abstracting away specific tools (Jira, Slack, etc.) into generic categories.
 */

import type { AppApprovalDetails, AppRole } from './approvalMethodTypes'

// ============================================================================
// APPROVER TYPES (per app configuration) - DEPRECATED
// ============================================================================

/**
 * Common fields for all approver types
 */
export interface BaseApprover {
  comment?: string
  roles?: Array<AppRole>
  approvalPolicy?: string
  postApprovalInstructions?: string
  seeMoreUrls?: Array<string>
}

/**
 * Bot approver configuration for an app
 */
export interface BotApprover extends BaseApprover {
  type: 'bot'
  url?: string
  prompt?: string
}

/**
 * Ticket approver configuration for an app
 */
export interface TicketApprover extends BaseApprover {
  type: 'ticket'
  url?: string
  requestFormTemplate?: string
}

/**
 * Person/Group approver configuration for an app
 */
export interface PersonApprover extends BaseApprover {
  type: 'person'
  email?: string
  url?: string
  description?: string
}

/**
 * Union of all approver types
 */
export type Approver = BotApprover | TicketApprover | PersonApprover

// ============================================================================
// UNIVERSAL ACCESS METHOD TYPES
// ============================================================================

/**
 * Bot-based access - request access through a chat bot
 */
export interface BotAccess {
  type: 'bot'
  providerId: string
  prompt: string
}

/**
 * Ticketing system access - submit a ticket/request
 */
export interface TicketingAccess {
  type: 'ticketing'
  providerId: string
  queue?: string
  portalPath?: string
  formId?: string
}

/**
 * Email-based access - contact specific people via email
 */
export interface EmailAccess {
  type: 'email'
  contacts: Array<{
    name?: string
    email: string
    role?: string
  }>
  subject?: string
  template?: string
}

/**
 * Self-service access - no approval needed, just follow instructions
 */
export interface SelfServiceAccess {
  type: 'self-service'
  url?: string
  instructions: string
}

/**
 * Documentation-based access - refer to external documentation
 */
export interface DocumentationAccess {
  type: 'documentation'
  url: string
  title?: string
}

/**
 * Manual/custom access - step-by-step instructions
 */
export interface ManualAccess {
  type: 'manual'
  instructions: string
  steps?: Array<string>
}

/**
 * Union type for all access methods
 */
export type AccessMethod =
  | BotAccess
  | TicketingAccess
  | EmailAccess
  | SelfServiceAccess
  | DocumentationAccess
  | ManualAccess

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
  access?: AccessMethod
  teams?: Array<string>
  approvalDetails?: AppApprovalDetails
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

export interface AppCatalogData {
  apps: Array<AppForCatalog>
  categories: Array<AppCategory>
}

// ============================================================================
// LEGACY DATA STRUCTURES (kept for backward compatibility)
// ============================================================================

export interface EhAppCatalogData {
  apps: Array<EhAppCatalogDto>
}

export interface EhAppCatalogDto {
  slug: string
  groups: Array<EhAppCatalogGroupDto>
}

export interface EhAppCatalogGroupDto {
  slug: string
  displayName: string
  pages: Array<EhAppCatalogPageDto>
}

export interface EhAppCatalogPageDto {
  slug: string
  displayName: string
}
