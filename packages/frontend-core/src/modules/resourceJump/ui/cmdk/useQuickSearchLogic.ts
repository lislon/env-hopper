import { use, useCallback, useMemo } from 'react'
import type { QuickOption } from '~/modules/resourceJump/ui/cmdk/types'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { QuickSearchContext } from '~/modules/resourceJump/ui/cmdk/QuickSearchContext'

export function useQuickSearchLogic() {
  const { environments, setCurrentEnv } = useEnvironmentContext()
  const { setCurrentFlagship, flagshipJumpResources } = useResourceJumpContext()

  const ctx = use(QuickSearchContext)
  if (!ctx) {
    throw new Error(
      'useQuickSearchLogic must be used within a QuickSearchProvider',
    )
  }

  const { searchMode, onOpenChange } = ctx

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
        ...flagshipJumpResources.slice(0, 5).map(({ slug, displayName }) => ({
          slug,
          displayName,
          type: 'app' as const,
        })),
      ]
    }
    if (isEnv) {
      arr = [
        ...arr,
        ...environments.slice(0, 5).map(({ slug, displayName }) => ({
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
