/* eslint-disable @typescript-eslint/consistent-type-imports */
import { LinkComponent, createLink } from '@tanstack/react-router'
import * as React from 'react'
import { cn } from '~/lib/utils'

interface BasicLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    className?: string
}

const BasicLinkComponent = ({ ref, className, ...props }: BasicLinkProps & { ref?: React.RefObject<HTMLAnchorElement | null> }) => {
    return (
      <a ref={ref} {...props} className={cn('text-primary hover:text-primary/80 transition-colors font-medium', className)} />
    )
  }

const CreatedLinkComponent = createLink(BasicLinkComponent)

export const Link: LinkComponent<typeof BasicLinkComponent> = (props) => {
  return <CreatedLinkComponent preload={'intent'} {...props} />
}