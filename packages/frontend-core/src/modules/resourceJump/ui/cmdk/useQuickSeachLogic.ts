import { use, useCallback, useMemo } from 'react'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { QuickSearchContext } from '~/modules/resourceJump/ui/cmdk/QuickSearchContext'
import type { QuickOption } from '~/modules/resourceJump/ui/cmdk/types'

export function useQuickSeachLogic() { const { environments, setCurrentEnv } = useEnvironmentContext()
  const {
    setCurrentFlagship,
    flagshipJumpResources,
  } = useResourceJumpContext()

  const r = use(QuickSearchContext)
  if (!r) {
    throw new Error(
      'useQuickSeachLogic must be used within a QuickSearchProvider',
    )
  }
  const { searchMode, onOpenChange } = r;

  const envsForApps = useMemo(() => {
    return environments.slice(0, 3)
  }, [environments])

  const options = useMemo(() => {
    const isApp = searchMode == 'app' || searchMode == 'anything'
    const isEnv = searchMode == 'env' || searchMode == 'anything'

    let arr: Array<QuickOption> = []
    if (isApp) {
      arr = [
        ...arr,
        ...flagshipJumpResources.map(({ slug, displayName }) => ({
          slug,
          displayName,
          type: 'app' as const,
        })),
      ]
    }
    if (isEnv) {
      arr = [
        ...arr,
        ...environments.map(({ slug, displayName }) => ({
          slug,
          displayName,
          type: 'env' as const,
        })),
      ]
    }
    return arr
  }, [environments, flagshipJumpResources, searchMode])

  const onSelect = useCallback(
    (slug: string) => {
      const option = options.find((o) => o.slug === slug)
      if (!option) return
      if (option.type === 'env') {
        setCurrentEnv(slug)
      }
      if (option.type === 'app') {
        setCurrentFlagship(slug)
      }
      onOpenChange(false)
    },
    [onOpenChange, options, setCurrentEnv, setCurrentFlagship],
  )

  return useMemo(() => {
    return {
      envsForApps,
      onSelect,
      options,
    }
  }, [envsForApps, onSelect, options])
}
