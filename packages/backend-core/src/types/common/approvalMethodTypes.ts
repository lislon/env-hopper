/**
 * Approval Method Types
 *
 * Global approval method templates that apps can link to.
 * Each method has a type (service, personTeam, custom) with type-specific config.
 */

// ============================================================================
// APPROVAL METHOD TYPES (Global Templates)
// ============================================================================

export type ApprovalMethodType = 'service' | 'personTeam' | 'custom'

/**
 * Contact for reaching out (not necessarily the approver)
 */
export interface ReachOutContact {
  displayName: string
  contact: string // email, slack handle, etc.
}

/**
 * Service type config - for bots, ticketing systems, self-service portals
 */
export interface ServiceConfig {
  url?: string // Service URL (clickable in UI)
  icon?: string // Icon identifier
}

/**
 * Person/Team type config - for human approvers
 */
export interface PersonTeamConfig {
  reachOutContacts?: Array<ReachOutContact>
}

/**
 * Custom type config - generic, no additional fields
 */
export interface CustomConfig {
  // No additional fields
}

/**
 * Union of all config types
 */
export type ApprovalMethodConfig =
  | ServiceConfig
  | PersonTeamConfig
  | CustomConfig

/**
 * Approval Method - stored in DbApprovalMethod
 */
export interface ApprovalMethod {
  id: string
  type: ApprovalMethodType
  displayName: string
  config?: ApprovalMethodConfig
  createdAt?: Date
  updatedAt?: Date
}

// ============================================================================
// PER-APP APPROVAL DETAILS
// ============================================================================

/**
 * Role that can be requested for an app
 */
export interface AppRole {
  name: string
  description?: string
}

/**
 * Approver contact (person who approves, may differ from reach-out contact)
 */
export interface ApproverContact {
  displayName: string
  contact?: string
}

/**
 * URL link with optional label
 */
export interface ApprovalUrl {
  label?: string
  url: string
}

/**
 * Per-app approval details - stored as JSON in DbAppForCatalog
 */
export interface AppApprovalDetails {
  approvalMethodId: string // FK to DbApprovalMethod

  // Common fields (all types) - markdown text
  comments?: string
  requestPrompt?: string
  postApprovalInstructions?: string

  // Lists
  roles?: Array<AppRole>
  approvers?: Array<ApproverContact>
  urls?: Array<ApprovalUrl>

  // Type-specific (Person/Team only)
  whoToReachOut?: string // markdown
}

// ============================================================================
// INPUT TYPES FOR API
// ============================================================================

export interface CreateApprovalMethodInput {
  type: ApprovalMethodType
  displayName: string
  config?: ApprovalMethodConfig
}

export interface UpdateApprovalMethodInput {
  id: string
  type?: ApprovalMethodType
  displayName?: string
  config?: ApprovalMethodConfig
}
