import { useQuery } from '@tanstack/react-query'
import { Button } from '~/components/ui/button'
import { ApiQueryMagazineResourceJump } from '~/modules/resourceJump/api/ApiQueryMagazineResourceJump'
import { useResourceJumpContext } from '~/modules/resourceJump/ResourceJumpContext'
import { getPrimaryResourceSlug } from '~/modules/resourceJump/utils/mapToFlagshipResourceJumps'

interface ResourceJumpGroupViewerProps {
  className?: string
}

export function ResourceJumpGroupViewer({
  className,
}: ResourceJumpGroupViewerProps) {
  const { setCurrentResourceJumpSlug, currentResourceJump } =
    useResourceJumpContext()
  const { data: resourceJumpsData, isLoading } = useQuery(
    ApiQueryMagazineResourceJump.getResourceJumps(),
  )

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground animate-pulse">
            Loading...
          </div>
        </div>
      </div>
    )
  }

  if (!resourceJumpsData || !currentResourceJump) {
    return null
  }

  // Find the group where the current resource is the primary resource
  const group = resourceJumpsData.groups?.find(
    (g) => getPrimaryResourceSlug(g) === currentResourceJump.slug,
  )

  // Only show if the selected app is a group (i.e., it's the primary resource of a group)
  if (!group) {
    return null
  }

  // Get all resources in this group
  const groupResources = resourceJumpsData.resourceJumps.filter((r) =>
    group.resourceSlugs.includes(r.slug),
  )

  return (
    <div className={`flex flex-col gap-2 ${className}`} data-testid="resource-jump-group-viewer">
      <div className="text-sm text-muted-foreground font-medium">
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




