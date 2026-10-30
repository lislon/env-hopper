import UiCredsIcon from '../UiCredentials/ui-creds.svg?react'
import { WidgetLeftBorder } from '../WidgetLeftBorder'
import { useMainAppFormContext } from '../../../context/MainFormContextProvider'
import { useLegacyCustomization } from '../../../adapter/legacyApi'
import {
  hasUnresolvedSubstitution,
  interpolateWidgetStr,
} from '../../../lib/utils'

/**
 * Where to get your own login, in the slot the shared one occupies elsewhere.
 *
 * Shown only on an environment whose override removes the credentials widget —
 * `widgets.ui === null` after the merge, as distinct from `undefined`, an app
 * that never had a login. Such an environment shares no login with anyone, so
 * the useful thing to say there is how to get one, whether or not the app has a
 * shared login on the other environments.
 *
 * Keeps the credentials widget's gutter and rule, so the slot reads as the same
 * widget on every environment; only its content changes. The row is a quiet
 * link with no box at rest. Its styling is plain rules in `index.css`
 * (`eh-access-*`), because a utility introduced in published source is never
 * compiled downstream.
 *
 * Every text comes from the deployment's `accessRequestCard`; with none
 * configured, or with a url that still names a value this app lacks, nothing
 * renders.
 */
export function AccessRequestCard() {
  const { env, app } = useMainAppFormContext()
  const { accessRequestCard: card, icons } = useLegacyCustomization()

  if (!card || app?.widgets?.ui !== null) {
    return null
  }
  const url = interpolateWidgetStr(card.urlDecoded, env, app)
  if (!url || hasUnresolvedSubstitution(url)) {
    return null
  }
  const iconRaw = icons?.find((icon) => icon.iconId === card.iconId)?.svg
  const text = (template: string | undefined) =>
    template ? interpolateWidgetStr(template, env, app) : undefined
  const subtitle = text(card.subtitle)
  const iconLabel = text(card.iconLabel)
  const cta = text(card.cta)

  return (
    <div className="flex items-start w-full">
      <WidgetLeftBorder>
        <div className="w-4 h-4">
          <UiCredsIcon />
        </div>
      </WidgetLeftBorder>
      <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2 w-full">
        <a
          href={encodeURI(url)}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="access-request-card"
          className="eh-access-row"
        >
          <span className="eh-access-text">
            <span className="eh-access-title">{text(card.title)}</span>
            {(subtitle || iconLabel) && (
              <span className="eh-access-sub">
                {subtitle}
                {iconRaw && (
                  <span
                    className="eh-access-icon"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: iconRaw }}
                  />
                )}
                {iconLabel}
              </span>
            )}
            {cta && <span className="eh-access-cta">{cta}</span>}
          </span>
          <span className="eh-access-arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      </div>
    </div>
  )
}
