/**
 * Resources like kafka topics, database tables, etc.
 */
export interface EhResourceIndexed {
  slug: string
  displayName: string
  defaultFixedValues?: Array<string>
}
