export interface SearchInteraction {
  dateUtcTimestamp: number
  query: string
  selection: SearchSelection
}

export type SearchSelection =
  | {
      type: 'env'
      envSlug: string
    }
  | {
      type: 'app'
      appSlug: string
    }
  | {
      type: 'appPage'
      appPageSlug: AppPageSlug
      appPageContext?: AppPageContext
    }
  | {
      type: 'envAppPage'
      envSlug: string
      appPageSlug: AppPageSlug
      appPageContext?: AppPageContext
    }
  | {
      type: 'envAction'
      envSlug: string
      actionName: string
    }

export interface MicroInteraction {
  dateUtcTimestamp: number
  context: MicroInteractionContext
  action: Action
}

export interface MicroInteractionContext {
  envSlug?: string
  appSlug?: string
  appPageSlug?: AppPageSlug
}

export type Action =
  | PageJumpAction
  | ConfigSearchAction
  | EnvSelectionAction
  | AppSelectionAction
  | AppPageSelectionAction
  | EnvAction

export interface EnvSelectionAction {
  actionType: 'envSelection'
  envSlug: string | undefined
}

export interface AppSelectionAction {
  actionType: 'appSelection'
  appSlug: string | undefined
}

export interface AppPageSelectionAction {
  actionType: 'appPageSelection'
  appPageSlug: AppPageSlug
}

export interface PageJumpAction {
  actionType: 'pageJump'
  envSlug: string
  appPageSlug: AppPageSlug
  appPageContext?: AppPageContext
}

export interface EnvAction {
  actionType: 'envAction'
  envSlug: string
  actionName: string
}

export interface AppPageSlug {
  app: string
  page: string
}

export interface AppPageContext {
  params: Array<AppPageContextKeyValue>
}

export interface AppPageContextKeyValue {
  key: string
  value: string
}

export interface ConfigSearchAction {
  actionType: 'configSearch'
  envSlug: string
  appSlug: string
  query: string
}
