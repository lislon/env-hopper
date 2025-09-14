import React from 'react'
import { Popover } from '~/components/ui/popover'
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

export function EhBaseSelectorLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(`text-secondary-foreground/50 text-sm`, className)}
      {...props}
    />
  )
}

export function EhBaseSelectorPopover({
  ...props
}: React.ComponentPropsWithoutRef<typeof Popover>) {
  return <Popover {...props} />
}

export function EhBaseSelectorCommand({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn(
        'hover:cursor-text hover:bg-accent hover:border-neutral-950 rounded-sm border-1 p-3 group',
        className,
      )}
      {...props}
    />
  )
}
