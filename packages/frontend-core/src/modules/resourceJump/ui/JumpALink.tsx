import type { ReactNode } from 'react'
import type { ResourceJumpItem } from '../types'
import type { EhPluginResouceJumpCtx } from '~/modules/pluginCore/types'
import { getJumpUrl } from '~/plugins/builtin/pageUrl/pageUrlAutoCompletePlugin'

export interface JumpUrlParams extends React.ComponentPropsWithoutRef<'a'> {
  children: ReactNode
  ctx: EhPluginResouceJumpCtx
  jumpResource: ResourceJumpItem
  id?: string
  // substitution?: EhSubstitutionValue;
  className?: string
  isMain?: boolean
  prefetch?: boolean
  testId?: string
}

export function JumpALink({
  children,
  ctx,
  id,
  jumpResource,
  // substitution,
  className,
  isMain,
  testId,
}: JumpUrlParams) {
  const onClick = () => {
    // if (jumpResource == null) {
    //   return
    // }
    // ...existing code...
  }

  const jumpUrl = getJumpUrl(jumpResource, ctx)
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
