import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { ChevronsUpDown } from 'lucide-react'
import { Button } from '~/ui/button'

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  const { children, ...rest } = props
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      className="flex items-center"
      asChild
      {...rest}
    >
      <Button variant="ghost" className="">
        <span>
          {' '}
          <ChevronsUpDown />
        </span>
        <span>{children}</span>
      </Button>
    </CollapsiblePrimitive.CollapsibleTrigger>
  )
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger }

