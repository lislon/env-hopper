import { useCallback, useMemo } from 'react'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'

export interface CmdkDriverInput {
  onOpenChange: (open: boolean) => void
}

export function useCmdkDriver({ onOpenChange }: CmdkDriverInput) {
  const { environments, setCurrentEnv } = useEnvironmentContext()
  const { setCurrentResourceJumpSlug } = useResourceJumpContext()

  const envsForApps = useMemo(() => {
    return environments.slice(0, 3)
  }, [environments])

  const onResourceJumpSelected = useCallback(
    (resourceJumpSlug: string) => {
      setCurrentResourceJumpSlug(resourceJumpSlug)
      onOpenChange(false)
    },
    [onOpenChange, setCurrentResourceJumpSlug],
  )

  const onEnvironmentSelected = useCallback(
    (envSlug: string) => {
      setCurrentEnv(envSlug)
      onOpenChange(false)
    },
    [onOpenChange, setCurrentEnv],
  )

  return useMemo(() => {
    return {
      envsForApps,
      onResourceJumpSelected,
      onEnvironmentSelected,
    }
  }, [envsForApps, onEnvironmentSelected, onResourceJumpSelected])
}
