import { useCallback, useMemo } from 'react'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import type { EhTemplateSelection } from './ehTemplate'
import { resolveEhTemplate } from './ehTemplate'

/**
 * Resolves a `{{...}}` template against the currently selected app and
 * environment, returning `undefined` when anything is left unresolved.
 *
 * Available placeholders: `app.slug`, `app.displayName`, `app.meta.*`,
 * `env.slug`, `env.displayName`, `env.meta.*`, and the environment's bare
 * `templateParams`. `{{key ?? default}}` supplies a default (an empty right
 * side means "drop it").
 */
export function useEhTemplate(): (template: string) => string | undefined {
  const { currentEnv } = useEnvironmentContext()
  const { currentResourceJump } = useResourceJumpContext()
  const bootstrap = useBootstrapConfig()

  const selection = useMemo<EhTemplateSelection>(
    () => ({
      app: currentResourceJump && {
        slug: currentResourceJump.slug,
        displayName: currentResourceJump.displayName,
        meta: bootstrap.apps[currentResourceJump.slug]?.meta,
      },
      env: currentEnv && {
        slug: currentEnv.slug,
        displayName: currentEnv.displayName,
        templateParams: currentEnv.templateParams,
        meta: bootstrap.envs[currentEnv.slug]?.meta,
      },
    }),
    [currentResourceJump, currentEnv, bootstrap],
  )

  return useCallback(
    (template: string) => resolveEhTemplate(template, selection),
    [selection],
  )
}
