import { BaseEditor, Descendant } from 'slate'
import { ReactEditor } from 'slate-react'

type TagElement = { type: 'tag'; children: CustomText[], selected: boolean }
type InterTagElement = { type: 'inter-tag'; children: CustomText[] }
type TagContainer = { type: 'tag-container'; children: CustomText[]}
type CustomText = { text: string }

export type CustomElement = TagElement | TagContainer | InterTagElement ;
export type CustomEditor = BaseEditor & ReactEditor;

declare module 'slate' {

  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText
  }
}
