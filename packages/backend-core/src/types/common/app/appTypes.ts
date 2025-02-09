import type { EhMetaDictionary, Tag } from '../sharedTypes'
import type { EhAppUiIndexed } from './ui/appUiTypes'

export interface EhAppIndexed {
  slug: string
  displayName: string
  abbr?: string
  aliases?: Array<string>
  ui?: EhAppUiIndexed
  tags?: Array<Tag>
  iconName?: string
  meta?: EhMetaDictionary
}
