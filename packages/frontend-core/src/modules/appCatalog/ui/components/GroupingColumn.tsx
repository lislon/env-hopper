import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/ui/accordion'
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '~/ui/item'
import { BaggageClaimIcon } from 'lucide-react'
import { Link } from '~/ui/link'
import { useAppCatalogContext } from '~/modules/appCatalog'

export interface GroupingColumnProps {
  className?: string
}

export interface FilterItem {
  displayName: string
  tag: string
}

export function GroupingColumn(props: GroupingColumnProps) {
  const { tagsDefinitions } = useAppCatalogContext()

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="shipping"
      className={props.className}
    >
      {tagsDefinitions.map(({ prefix, displayName, values }) => {
        return (
          <AccordionItem value={prefix} key={prefix}>
            <AccordionTrigger>By {displayName}</AccordionTrigger>
            <AccordionContent>
              <ItemGroup>
                {values.map(({ displayName: displayNameTag, value }) => (
                  <Item className="p-2" asChild={true} key={value}>
                    <Link
                      to={'.'}
                      search={{
                        filterTag: `${prefix}:${value}`,
                      }}
                    >
                      <ItemMedia variant="icon">
                        <BaggageClaimIcon />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{displayNameTag}</ItemTitle>
                      </ItemContent>
                    </Link>
                  </Item>
                ))}
              </ItemGroup>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

export interface MiniCardProps {
  children?: React.ReactNode
}
