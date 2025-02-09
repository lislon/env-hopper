import type { Tag } from '../../sharedTypes'

export interface EhAppPageIndexed {
  slug: string
  displayName: string
  url: string
  tags?: Array<Tag>
}

export interface EhAppUiIndexed {
  pages: Array<EhAppPageIndexed>
}
