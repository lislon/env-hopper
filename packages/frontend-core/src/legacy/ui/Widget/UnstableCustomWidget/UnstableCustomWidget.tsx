/**
 * STUB — the container, without its contents.
 *
 * This is the list of per-app links (repository, issue tracker, dashboards…)
 * that the previous UI read off `GET /api/customization` as `appLinkTypes`: a
 * title, an icon and a url template per link type, resolved per app. Two things
 * it needs are absent, and neither can be invented here:
 *
 *  - the link types themselves. `LegacyCustomization` in `adapter/legacyApi`
 *    carries only `footerHtml` today; the settings surface that would carry
 *    link types and their icons is separate, unfinished work.
 *  - `app.meta`, which is what every one of those url templates interpolates
 *    (`{{app.meta.git}}` and friends). No app on the current payload carries a
 *    `meta`, so even with the link types in hand every url would resolve to its
 *    own template text.
 *
 * Do not rebuild this from scratch: `modules/uiSettings/AppLinksPanel` is the
 * same feature on the current settings seam (`useUiSettings().appLinks` resolved
 * through `useEhTemplate`), and it likewise renders nothing while no app carries
 * a `meta`. Once the payload does, this file becomes a wrapper around it rather
 * than a second implementation.
 *
 * The empty list is rendered rather than nothing so the panel's spacing matches
 * and filling this in is an edit to one file.
 */
export function UnstableCustomWidget() {
  return (
    <ul
      className={'flex flex-col gap-2 mt-4'}
      data-testid="app-links-placeholder"
    />
  )
}
