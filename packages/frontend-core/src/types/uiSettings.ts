import type { ReactNode } from 'react'

/**
 * A long-form content page contributed by the consuming app — help, FAQ,
 * release notes. The core only gives it a place to be opened from.
 */
export interface EhAboutPage {
  id: string
  title: string
  content: ReactNode
}

/**
 * Context handed to an {@link EhAppLink.render} escape hatch.
 */
export interface EhLinkContext {
  /** The link being rendered. */
  link: EhAppLink
  /** `link.title` resolved against the current selection, if resolvable. */
  title: string | undefined
  /** `link.url` resolved against the current selection, if resolvable. */
  url: string | undefined
  /** Resolve any other template against the current selection. */
  resolve: (template: string) => string | undefined
}

/**
 * An extra link shown next to the selected app. `title` and `url` are
 * templates resolved per app/environment — see `useEhTemplate` for the
 * available placeholders and the `{{key ?? default}}` operator.
 *
 * Links are data rather than JSX because they need that per-selection
 * resolution and the core owns the panel chrome; `render` is the escape hatch
 * for anything the data shape cannot express.
 */
export interface EhAppLink {
  id: string
  icon: ReactNode
  /** Template, e.g. `Logs for {{app.displayName}}`. */
  title: string
  /** Template. A link whose url cannot be resolved is not rendered. */
  url: string
  render?: (ctx: EhLinkContext) => ReactNode
}

/**
 * UI settings passed from the app entry point.
 *
 * Every field is optional and `{}` behaves exactly like passing nothing, so a
 * consuming app adopts the pieces it needs and no more.
 */
export interface EhUiSettings {
  /** Consumer-supplied content rendered inside core layouts. */
  slots?: {
    /** Replaces the default footer content. */
    footer?: ReactNode
    /** Opened from the footer; the core supplies only the modal chrome. */
    aboutPages?: Array<EhAboutPage>
  }
  /** Extra links for the selected app, rendered as a panel. */
  appLinks?: Array<EhAppLink>
}
