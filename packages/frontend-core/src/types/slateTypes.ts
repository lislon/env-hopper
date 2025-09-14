import type { BaseEditor } from 'slate'
import type { ReactEditor } from 'slate-react'

type TagElement = {
  type: 'tag'
  children: Array<CustomText>
  selected: boolean
}
type InterTagElement = { type: 'inter-tag'; children: Array<CustomText> }
type TagContainer = { type: 'tag-container'; children: Array<CustomText> }
type CustomText = { text: string }

export type CustomElement = TagElement | TagContainer | InterTagElement
export type CustomEditor = BaseEditor & ReactEditor

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText
  }
}
