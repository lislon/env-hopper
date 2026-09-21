import { useEffect, useState } from 'react'
import cn from 'classnames'
import UiCredsIcon from './ui-creds.svg?react'
import { ReadonlyCopyField } from '../../ReadonlyCopyField'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { LOCAL_STORAGE_KEY_UI_PASS_TABS_POSITIONS } from '../../../lib/local-storage-constants'
import { useMainAppFormContext } from '../../../context/MainFormContextProvider'
import { interpolateWidgetStr } from '../../../lib/utils'
import { WidgetLeftBorder } from '../WidgetLeftBorder'
import { HideSensitiveDataToggle } from '../../HideSensitiveDataToggle'
import type {
  EhApp,
  EhAppWidgetUiCredsMany,
  EhAppWidgetUiCredsOne,
} from '../../../types'

export interface UiCredentialsProps {
  className?: string
}

function isMultiPass(
  ui: EhAppWidgetUiCredsOne | EhAppWidgetUiCredsMany | undefined,
): ui is EhAppWidgetUiCredsMany {
  return Array.isArray(ui)
}

interface UiPassTab {
  appTitle: string
  tabNo: number
}

/**
 * LEGACY DEFECT FIXED, not reproduced: the original condition was
 * `tabNo > uis.length`, which is backwards. It discarded every remembered tab
 * that was in range — so the localStorage write below never had an effect — and
 * returned an out-of-range index when an app's credential list had shrunk, which
 * made the whole widget vanish (`uis[tabNo]` is then undefined).
 */
function getInitialSelectedTab(
  uiPassTabs: Array<UiPassTab>,
  app: EhApp | undefined,
  uis: Array<unknown>,
): number {
  const tabNo = uiPassTabs.find((p) => p.appTitle === app?.appTitle)?.tabNo
  if (tabNo !== undefined && tabNo > 0 && tabNo < uis.length) {
    return tabNo
  }
  return 0
}

/**
 * The username and password the app's own UI takes, for the selected app.
 *
 * An app can carry several sets (one per site or per login domain); those render
 * as tabs and the chosen tab is remembered per app in localStorage.
 *
 * Not ported: a second effect that called `getInitialSelectedTab` and threw the
 * result away. It had no effect and no side effect.
 */
export function UiCredentials({ className }: UiCredentialsProps) {
  const { listApps, env, app, isHideSensitiveInfo } = useMainAppFormContext()

  const ui = app?.widgets?.ui
  const uis = isMultiPass(ui) ? ui : [ui]

  const [uiPassTabs, setPassTabs] = useLocalStorage<Array<UiPassTab>>(
    LOCAL_STORAGE_KEY_UI_PASS_TABS_POSITIONS,
    () => [],
  )
  const [tabNo, setTabNo] = useState(() =>
    getInitialSelectedTab(uiPassTabs, app, uis),
  )

  /*
   * Remember the selected tab for this app, and forget the entry for any app
   * that is no longer in the catalogue. Written as a functional update — the
   * original read the stored list straight out of the closure, which made the
   * effect depend on the value it was about to overwrite.
   */
  useEffect(() => {
    if (app === undefined) {
      return
    }
    setPassTabs((stored) =>
      stored
        .filter((p) => p.appTitle !== app.appTitle)
        .filter((p) => listApps.some((a) => a.appTitle === p.appTitle))
        .concat(tabNo !== 0 ? [{ appTitle: app.appTitle ?? '', tabNo }] : []),
    )
  }, [tabNo, app, listApps, setPassTabs])

  const tabContent = uis[tabNo]

  if (!tabContent) {
    return null
  }

  return (
    <div
      className={cn('flex tooltip tooltip-left items-start w-full', className)}
      data-tip={
        `Credentials for the app UI` +
        `${tabContent.desc ? `: ${tabContent.desc}` : ''}`
      }
    >
      <WidgetLeftBorder>
        <div className="w-4 h-4">
          <UiCredsIcon />
        </div>
        <HideSensitiveDataToggle />
      </WidgetLeftBorder>
      <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2 w-full">
        {isMultiPass(ui) && uis.length > 1 && (
          <ul role="tablist" className="tabs tabs-lifted tabs-xs p-1 ">
            {ui.map(({ label }, i) => (
              <li
                key={i}
                role="tab"
                aria-selected={tabNo === i}
                className={cn('tab', [{ 'tab-active': tabNo === i }])}
                onClick={() => setTabNo(i)}
              >
                {label || `# ${i + 1}`}
              </li>
            ))}
          </ul>
        )}

        <div className="grid text-sm grid-rows-2 gap-1 items-center">
          <div>
            <ReadonlyCopyField
              value={interpolateWidgetStr(tabContent.username, env, app)}
            />
          </div>
          <div>
            <ReadonlyCopyField
              value={interpolateWidgetStr(tabContent.password, env, app)}
              isHideSensitiveInfo={isHideSensitiveInfo}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
