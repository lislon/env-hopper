 
import * as React from 'react'
import { cn } from '~/lib/utils'

interface BasicLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string
}

export const LinkExternal = ({
  ref,
  href,
  className,
  ...props
}: BasicLinkProps & { ref?: React.RefObject<HTMLAnchorElement | null> }) => {
  return (
    <a
      ref={ref}
      href={href}
      target='_blank'
      {...props}
      className={cn(
        'text-primary hover:text-primary/80 transition-colors font-medium',
        className,
      )}
    />
  )
}
