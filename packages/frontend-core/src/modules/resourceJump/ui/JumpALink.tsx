import type { ReactNode } from 'react'

export interface JumpUrlParams extends React.ComponentPropsWithoutRef<'a'> {
  children: ReactNode
  jumpUrl: string
  id?: string
  className?: string
  isMain?: boolean
  prefetch?: boolean
  testId?: string
}

export function JumpALink({
  children,
  jumpUrl,
  id,
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

  if (!jumpUrl) {
    return <div className={className}>{children}</div>
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
