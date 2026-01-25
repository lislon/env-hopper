/**
 * App Catalog Types - Universal Software Access Request Catalog
 *
 * These types define a standardized catalog of software applications and their
 * access/approval methods. The typing system is designed to be universal across companies.
 */

// ============================================================================
// PERSON TYPE
// ============================================================================

/**
 * Person who can approve access requests
 */
export interface Person {
  firstName: string
  lastName: string
  email: string
  slack?: string
}

// ============================================================================
// APPROVAL METHOD TYPES
// ============================================================================

/**
 * Approval type for UI selection
 */
export type ApprovalType = 'none' | 'service' | 'person' | 'other' | 'unknown'

/**
 * Approval type options for UI display
 */
export const APPROVAL_TYPES: ReadonlyArray<{
  value: ApprovalType
  label: string
}> = [
  { value: 'none', label: 'None' },
  { value: 'service', label: 'Service' },
  { value: 'person', label: 'Person' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
]

/**
 * Common fields for all approval method types
 */
export interface BaseApprovalMethod {
  comment?: string
  roles?: Array<AppRole>
  approvalPolicy?: string
  postApprovalInstructions?: string
  seeMoreUrls?: Array<string>
}

/**
 * Service-based approval (bot or ticketing system)
 */
export interface ServiceApprovalMethod extends BaseApprovalMethod {
  type: 'service'
  serviceId: string // References a specific service (bot or ticket system)
  url?: string
  prompt?: string // For bots
  requestFormTemplate?: string // For ticket systems
}

/**
 * Person-based approval
 */
export interface PersonApprovalMethod extends BaseApprovalMethod {
  type: 'person'
  person: Person // Person details embedded directly
  url?: string
  additionalInfo?: string
}

/**
 * Other/custom approval method (TBC)
 */
export interface OtherApprovalMethod extends BaseApprovalMethod {
  type: 'other'
  description: string // Free-form text description
}

/**
 * Unknown approval method
 */
export interface UnknownApprovalMethod extends BaseApprovalMethod {
  type: 'unknown'
}

/**
 * No approval needed
 */
export interface NoneApprovalMethod {
  type: 'none'
}

/**
 * Union of all approval method types
 */
export type ApprovalMethod =
  | NoneApprovalMethod
  | ServiceApprovalMethod
  | PersonApprovalMethod
  | OtherApprovalMethod
  | UnknownApprovalMethod

// ============================================================================
// SERVICE APPROVAL TYPES (BOT & TICKETING)
// ============================================================================

/**
 * Service approval configuration - unified bot and ticketing systems
 */
export interface ServiceApproval {
  id: string
  name: string
  serviceType: 'bot' | 'ticket'
  // Bot-specific fields
  platform?: 'slack' | 'teams' | 'web' | 'other'
  // Ticket-specific fields
  system?: 'jira' | 'servicenow' | 'zendesk' | 'freshdesk' | 'other'
  baseUrl?: string
  url?: string
  icon?: string
  instructions?: string
}

// ============================================================================
// ROLE TYPE
// ============================================================================

/**
 * Role that can be requested for an app
 */
export interface AppRole {
  name: string
  description?: string
}

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
  approvalMethod?: ApprovalMethod
  teams?: Array<string> // Teams that use this app
  notes?: string
  tags?: Array<string>
  appUrl?: string
  links?: Array<{ url: string; title?: string }>
  iconName?: string
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
