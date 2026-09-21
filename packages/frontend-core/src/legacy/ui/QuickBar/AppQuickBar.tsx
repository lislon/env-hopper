import { useMemo } from 'react'
import type { EhAppId } from '../../types'
import type { BarElement, QuickBarSharedProps } from './InternalCommonBar'
import { InternalCommonBar } from './InternalCommonBar'
import { MAX_RECENTLY_USED_ITEMS_COMBO } from '../../lib/constants'
import { unique } from 'radashi'
import cn from 'classnames'
import { formatAppTitleShort } from '../../lib/format/FormatAppTitleShort'
import { useMainAppFormContext } from '../../context/MainFormContextProvider'

export function AppQuickBar(props: QuickBarSharedProps) {
  const { listFavoriteApps, setApp, getAppById, app, recentJumps } =
    useMainAppFormContext()

  const favorites = useMemo<Array<BarElement<string>>>(() => {
    return listFavoriteApps
      .map((appId) => getAppById(appId))
      .filter((app) => app !== undefined)
      .map((app) => ({
        id: app.id,
        title: formatAppTitleShort(app),
      }))
  }, [listFavoriteApps, getAppById])

  const recent = useMemo<Array<BarElement<string>>>(() => {
    return unique(
      recentJumps.map((recent) => recent.app).filter((id) => id !== undefined),
    )
      .slice(0, MAX_RECENTLY_USED_ITEMS_COMBO)
      .map((id) => {
        return {
          id: id,
          title: formatAppTitleShort(getAppById(id)),
        }
      })
  }, [recentJumps, getAppById])

  const onClick = (appId: EhAppId) => {
    const appById = getAppById(appId)
    setApp(appById)
  }

  return (
    <div className={cn(props.className, 'flex flex-col gap-2')}>
      <InternalCommonBar
        activeId={app?.id}
        list={recent}
        onClick={onClick}
        comboboxType={'applications'}
        favoriteOrRecent={'recent'}
      />
      <InternalCommonBar
        activeId={app?.id}
        list={favorites}
        onClick={onClick}
        comboboxType={'applications'}
        favoriteOrRecent={'favorite'}
      />
    </div>
  )
}
