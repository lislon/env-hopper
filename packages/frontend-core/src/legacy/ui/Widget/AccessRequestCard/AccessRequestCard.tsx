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

  return (
    <a
      href={encodeURI(url)}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="access-request-card"
      className="flex items-center gap-3 w-full rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-3 text-inherit no-underline transition hover:border-orange-700 hover:shadow-md focus-visible:border-orange-700 focus-visible:shadow-md focus-visible:outline-none dark:border-orange-900 dark:bg-orange-950/40 dark:hover:border-orange-500 dark:focus-visible:border-orange-500"
    >
      {iconRaw && (
        <div
          className="w-10 h-10 shrink-0 [&>svg]:w-full [&>svg]:h-full"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: iconRaw }}
        />
      )}
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-tight">
          {interpolateWidgetStr(card.title, env, app)}
        </div>
        {card.subtitle && (
          <div className="text-xs opacity-70 mt-0.5">
            {interpolateWidgetStr(card.subtitle, env, app)}
          </div>
        )}
        <div className="text-sm font-semibold mt-1 text-orange-700 dark:text-orange-400">
          {interpolateWidgetStr(card.cta, env, app)}
        </div>
      </div>
    </a>
  )
}
