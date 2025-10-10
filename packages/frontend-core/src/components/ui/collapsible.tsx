import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "~/components/ui/button"

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
      {...rest}
    >
      {children}
          <Button variant="ghost" size="icon-sm" className="size-8">
            <ChevronsUpDown />
            <span className="sr-only">Toggle</span>
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

