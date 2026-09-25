import cn from 'classnames'
import { useMainAppFormContext } from '../../../context/MainFormContextProvider'
import { useLegacyCustomization } from '../../../adapter/legacyApi'
import {
  hasUnresolvedSubstitution,
  interpolateWidgetStr,
} from '../../../lib/utils'

export interface LinkTypeWidgetProps {
  className?: string
  iconRaw?: string
  title?: string
  url: string
}

function LinkTypeWidget({
  className,
  url,
  title,
  iconRaw,
}: LinkTypeWidgetProps) {
  return (
    <a className="link text-sm" href={url} target={'_blank'}>
      <div className={cn('flex items-center gap-2', className)}>
        {iconRaw && (
          <div
            className="w-4 h-4"
            dangerouslySetInnerHTML={{ __html: iconRaw }}
          />
        )}
        <div>{title}</div>
      </div>
    </a>
  )
}

/**
 * The per-app link list beside the form: repository, pipelines, issue tracker,
 * dashboards, whatever else the deployment configures.
 *
 * There is no per-link condition anywhere in the config, and none is needed:
 * every link is a url template over the selected app's and environment's
 * values, and a link whose template still has a placeholder left in it is
 * dropped. That is the whole rule, and it is what makes the list differ per
 * environment — a link naming a value the environment does not define simply
 * does not appear there.
 *
 * INTENTIONAL DIFF: the link types came from `useSuspenseQuery` over
 * `GET /api/customization`; they now arrive with `bootstrap`, so this reads the
 * adapter hook instead. Same data, one round trip fewer, and the list is empty
 * for one frame rather than suspending.
 */
export function UnstableCustomWidget() {
  const { env, app } = useMainAppFormContext()
  const customization = useLegacyCustomization()

  return (
    <ul className={'flex flex-col gap-2 mt-4'} data-testid="app-links">
      {(customization.appLinkTypes ?? [])
        .map((linkType) => {
          const iconRaw = customization.icons?.find(
            (icon) => icon.iconId === linkType.iconId,
          )?.svg
          const url = interpolateWidgetStr(linkType.urlDecoded, env, app)
          if (!url || hasUnresolvedSubstitution(url)) {
            return null
          }

          return (
            <li key={linkType.typeId}>
              <LinkTypeWidget
                iconRaw={iconRaw}
                title={interpolateWidgetStr(linkType.title, env, app)}
                url={encodeURI(url)}
              />
            </li>
          )
        })
        .filter(Boolean)}
    </ul>
  )
}
