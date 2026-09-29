import cn from 'classnames'
import DbCredsIcon from './db-creds.svg?react'
import { ReadonlyCopyField } from '../../ReadonlyCopyField'
import { useMainAppFormContext } from '../../../context/MainFormContextProvider'
import { interpolateWidgetStr } from '../../../lib/utils'
import { HideSensitiveDataToggle } from '../../HideSensitiveDataToggle'
import { WidgetLeftBorder } from '../WidgetLeftBorder'

export interface DbCredentialsWidgetProps {
  className?: string
}

/**
 * The selected app's database url, username and password for the selected
 * environment. Needs both: a url without an environment is meaningless.
 */
export function DbCredentialsWidget({ className }: DbCredentialsWidgetProps) {
  const { app, env, isHideSensitiveInfo } = useMainAppFormContext()
  const db = app?.widgets?.db

  if (!db || !env) {
    return null
  }

  return (
    <div className={cn('flex ', className)} data-testid="widget-db-credentials">
      <WidgetLeftBorder>
        <div
          className="w-4 h-4 tooltip tooltip-left"
          data-tip="Credentials for the app DB"
        >
          <DbCredsIcon />
        </div>
        <HideSensitiveDataToggle />
      </WidgetLeftBorder>
      <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2 w-full">
        <div className="grid text-sm grid-rows-2 gap-1 items-center">
          <div>
            <ReadonlyCopyField value={interpolateWidgetStr(db.url, env, app)} />
          </div>
          <div>
            <ReadonlyCopyField
              value={interpolateWidgetStr(db.username, env, app)}
              isHideSensitiveInfo={isHideSensitiveInfo}
            />
          </div>
          <div>
            <ReadonlyCopyField
              value={interpolateWidgetStr(db.password, env, app)}
              isHideSensitiveInfo={isHideSensitiveInfo}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
