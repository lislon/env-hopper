import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ApiQueryMagazineResourceJump } from '~/modules/resourceJump/api/ApiQueryMagazineResourceJump'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { getUngroupedResources } from '~/modules/resourceJump/utils/mapToFlagshipResourceJumps'
import { Button } from '~/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/ui/collapsible'

interface AppQuickJumpBarProps {
  className?: string
}

export function AppQuickJumpBar({ className }: AppQuickJumpBarProps) {
  const { setCurrentResourceJumpSlug, currentResourceJump } =
    useResourceJumpContext()
  const { data: resourceJumpsData, isLoading } = useQuery(
    ApiQueryMagazineResourceJump.getResourceJumps(),
  )

  // Track which groups are expanded (default to expanded if current resource is in the group)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  )

  // Auto-expand groups that contain the current resource
  useEffect(() => {
    if (!resourceJumpsData || !currentResourceJump) {
      return
    }

    resourceJumpsData.groups?.forEach((group) => {
      if (group.resourceSlugs.includes(currentResourceJump.slug)) {
        setExpandedGroups((prev) => {
          const next = new Set(prev)
          next.add(group.slug)
          return next
        })
      }
    })
  }, [resourceJumpsData, currentResourceJump?.slug, currentResourceJump])

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex flex-col gap-2 w-full">
          {Array.from({ length: 7 }).map((_, i) => (
            <Button
              key={`skeleton-${i}`}
              variant="ghost"
              disabled
              className="justify-start text-left animate-pulse"
            >
              <span className="text-xs truncate">Loading...</span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  if (!resourceJumpsData) {
    return null
  }

  // Get ungrouped resources
  const ungroupedResources = getUngroupedResources(
    resourceJumpsData.resourceJumps,
    resourceJumpsData.groups,
  )

  return (
    <div className={`${className}`} data-testid="quick-jump-section">
      <div className="flex flex-col gap-1 w-full">
        {/* Show ungrouped resources first */}
        {ungroupedResources.map((resource) => {
          const isActive = resource.slug === currentResourceJump?.slug
          return (
            <Button
              key={resource.slug}
              variant="ghost"
              onClick={() => setCurrentResourceJumpSlug(resource.slug)}
              className={`justify-start text-left w-full ${
                isActive ? 'bg-accent text-accent-foreground font-medium' : ''
              }`}
            >
              <span className="text-xs truncate flex-1">
                {resource.displayName}
              </span>
            </Button>
          )
        })}

        {/* Show groups with nested resources */}
        {resourceJumpsData.groups?.map((group) => {
          const groupResources = resourceJumpsData.resourceJumps.filter((r) =>
            group.resourceSlugs.includes(r.slug),
          )
          const isExpanded = expandedGroups.has(group.slug)
          const hasActiveResource = groupResources.some(
            (r) => r.slug === currentResourceJump?.slug,
          )

          return (
            <Collapsible
              key={group.slug}
              open={isExpanded}
              onOpenChange={(open) => {
                if (open) {
                  setExpandedGroups((prev) => new Set(prev).add(group.slug))
                } else {
                  setExpandedGroups((prev) => {
                    const next = new Set(prev)
                    next.delete(group.slug)
                    return next
                  })
                }
              }}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={`justify-start text-left w-full ${
                    hasActiveResource
                      ? 'bg-accent/50 text-accent-foreground font-medium'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 shrink-0" />
                    )}
                    <span className="text-xs truncate font-semibold">
                      {group.displayName}
                    </span>
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4">
                <div className="flex flex-col gap-1 mt-1">
                  {groupResources.map((resource) => {
                    const isActive = resource.slug === currentResourceJump?.slug
                    return (
                      <Button
                        key={resource.slug}
                        variant="ghost"
                        onClick={() =>
                          setCurrentResourceJumpSlug(resource.slug)
                        }
                        className={`justify-start text-left w-full ${
                          isActive
                            ? 'bg-accent text-accent-foreground font-medium'
                            : ''
                        }`}
                      >
                        <span className="text-xs truncate flex-1 pl-4">
                          {resource.displayName}
                        </span>
                      </Button>
                    )
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
