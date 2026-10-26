import type { ReactNode } from 'react'
import { getJumpUrl } from '../../lib/utils'
import type { EhApp, EhEnv, EhSubstitutionValue } from '../../types'
import { useMainAppFormContext } from '../../context/MainFormContextProvider'
import { useRecordUsage } from '../../../modules/usage/recordUsage'
import { appSlugFromJumpSlug } from '../../../util/route-utils'

export interface JumpUrlParams {
  children: ReactNode
  app?: EhApp
  env?: EhEnv
  id?: string
  substitution?: EhSubstitutionValue
  className?: string
  isMain?: boolean
  prefetch?: boolean
  testId?: string
}

export function JumpALink({
  children,
  app,
  id,
  env,
  substitution,
  className,
  isMain,
  testId,
}: JumpUrlParams) {
  const { recordJump } = useMainAppFormContext()
  const recordUsage = useRecordUsage()
  const jumpUrl = getJumpUrl({ app, env, substitution })

  const onClick = () => {
    if (!app || !env) {
      return
    }
    recordUsage({
      kind: 'jump',
      appSlug: appSlugFromJumpSlug(app.id),
      envSlug: env.id,
      resourceJump: app.id,
      ...(jumpUrl && { url: jumpUrl }),
    })
    recordJump({
      app: app,
      env: env,
      substitution,
    })
  }

  if (!jumpUrl) {
    return undefined
  }
  return (
    <a
      id={id}
      data-testid={testId}
      href={jumpUrl}
      onClick={onClick}
      onAuxClick={onClick}
      className={className}
      target="_blank"
      rel="noreferrer"
      title={isMain ? 'Jump to selected app' : undefined}
    >
      {children}
    </a>
  )
}
