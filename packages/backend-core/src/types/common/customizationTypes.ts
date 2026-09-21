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

/** An inline SVG, injected as markup so it inherits the surrounding colour. */
export interface EhIconSvg {
  iconId: string
  svg: string
}

export interface EhCustomizationData {
  /** Raw HTML for the footer. */
  footerHtml?: string
  /** Raw JS injected once, with `{{APP_VERSION}}` substituted. */
  analyticsScript?: string
  /** Extra about-dialog slides, raw HTML, appended after the built-in ones. */
  slidesHtml?: Array<string>
  appLinkTypes?: Array<EhAppLinkType>
  icons?: Array<EhIconSvg>
}
