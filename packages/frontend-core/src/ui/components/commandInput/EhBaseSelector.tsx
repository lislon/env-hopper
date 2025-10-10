import React from 'react'
import { cn } from '~/lib/utils'

export function EhBaseSelectorRoot({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        `flex flex-col gap-1 duration-100 transition-all`,
        className,
      )}
      {...props}
    />
  )
}
