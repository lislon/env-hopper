/**
 * Per-deployment presentation config: the parts of the UI a company fills in
 * rather than the open source project.
 *
 * This travels on `bootstrap` rather than on an endpoint of its own. The
 * previous generation served it from `GET /api/customization`, one extra round
 * trip with its own loading state; everything here is needed to paint the first
 * screen, so it belongs with the rest of the boot payload.
 */

/**
 * One row of the per-app link list — repository, issue tracker, dashboard.
 *
 * `urlDecoded` and `title` are templates over the same placeholders a jump url
 * uses (`{{app.meta.*}}`, `{{env.meta.*}}`, `{{env.id}}`), including the `??`
 * default. A link whose url still has an unresolved placeholder after
 * substitution is not rendered at all: that is how a link that only applies to
 * some apps or some environments stays out of the way, with no per-link
 * condition to declare.
 */
export interface EhAppLinkType {
  typeId: string
  /** Matches `EhIconSvg.iconId`. An unknown id renders the row without an icon. */
  iconId: string
  title: string
  urlDecoded: string
}

/**
 * What the credentials slot shows on an environment that shares no login — one
 * whose app override marks `credentials` unavailable: where to get your own
 * access instead.
 *
 * Every text is a template over the same placeholders as `EhAppLinkType`, plus
 * `{{app.displayName}}`. The card is not rendered while `urlDecoded` still has
 * an unresolved placeholder, so an app without the value the url names gets no
 * card, the same rule the link list follows.
 */
export interface EhAccessRequestCard {
  /** Matches `EhIconSvg.iconId`. An unknown id renders the card without an icon. */
  iconId: string
  title: string
  subtitle?: string
  /** The call to action under the title, e.g. `How to request access →`. */
  cta: string
  urlDecoded: string
}

/** An inline SVG, injected as markup so it inherits the surrounding colour. */
export interface EhIconSvg {
  iconId: string
  svg: string
}

/**
 * One row of the dialog the header's version label opens: what this deployment
 * was built from and where to ask about it.
 */
export interface EhVersionRow {
  /** Matches `EhIconSvg.iconId`. An unknown id renders the row without an icon. */
  iconId?: string
  /** Static prefix before the value, e.g. `Pipeline`. */
  label?: string
  /** The row's value; a link when `href` is set. */
  value: string
  href?: string
  /** One line under the row saying what it points at. */
  description?: string
  /** Renders the value in a monospace face, for ids and hashes. */
  mono?: boolean
}

export interface EhCustomizationData {
  /** Raw HTML for the footer. */
  footerHtml?: string
  /**
   * Rows for the dialog the header's version label opens — build links, who to
   * ask for help. Empty: the label links straight to the release.
   */
  versionRows?: Array<EhVersionRow>
  /** Small print in that dialog: who runs this deployment. */
  versionCredit?: string
  /** When this build was made, ISO 8601. Shown as a date beside the credit. */
  versionBuiltAt?: string
  /** Raw JS injected once, with `{{APP_VERSION}}` substituted. */
  analyticsScript?: string
  /** Extra about-dialog slides, raw HTML, appended after the built-in ones. */
  slidesHtml?: Array<string>
  appLinkTypes?: Array<EhAppLinkType>
  /** Replaces the credentials widget where the environment shares no login. */
  accessRequestCard?: EhAccessRequestCard
  icons?: Array<EhIconSvg>
}
