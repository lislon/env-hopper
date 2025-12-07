import { useQuery } from '@tanstack/react-query'
import { Button } from '~/components/ui/button'
import { ApiQueryMagazineResourceJump } from '~/modules/resourceJump/ApiQueryMagazineResourceJump'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'

interface GroupViewProps {
  className?: string
}

export function GroupView({ className }: GroupViewProps) {
  const { currentResourceJump, setCurrentResourceJumpSlug } =
    useResourceJumpContext()
  const { data: resourceJumpsData, isLoading } = useQuery(
    ApiQueryMagazineResourceJump.getResourceJumps(),
  )

  // Don't show anything while loading
  if (isLoading || !resourceJumpsData || !currentResourceJump) {
    return null
  }

  // Find the group that contains the current resource (works for any resource in the group, not just primary)
  const group = resourceJumpsData.groups?.find((g) =>
    g.resourceSlugs.includes(currentResourceJump.slug),
  )

  // Only show if the current resource is part of a group
  if (!group) {
    return null
  }

  // Get all resources in this group
  const groupResources = resourceJumpsData.resourceJumps.filter((r) =>
    group.resourceSlugs.includes(r.slug),
  )

  return (
    <div
      className={`flex flex-col gap-2 ${className}`}
      data-testid="group-view-section"
    >
      <div className="text-sm font-semibold text-foreground mb-1">
        {group.displayName}
      </div>
      <div className="flex flex-col gap-1">
        {groupResources.map((resource) => {
          const isActive = resource.slug === currentResourceJump.slug
          return (
            <Button
              key={resource.slug}
              variant="ghost"
              onClick={() => setCurrentResourceJumpSlug(resource.slug)}
              className={`justify-start text-left w-full ${
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : ''
              }`}
            >
              <span className="text-sm truncate flex-1">
                {resource.displayName}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

