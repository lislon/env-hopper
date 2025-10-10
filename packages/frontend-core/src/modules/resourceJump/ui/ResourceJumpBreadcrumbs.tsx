import { HomeIcon } from 'lucide-react'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import {
  getFlashipResource,
  isFlagshipResource,
} from '~/modules/resourceJump/utils/helpers'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '~/ui/breadcrumb'
import { Link } from '~/ui/link'
import { getEhToOptions } from '~/util/route-utils'

export interface ResourceJumpBreadcrumbsProps {
  className?: string
}

export function ResourceJumpBreadcrubms() {
  const { currentFlagship, currentResourceJump } = useResourceJumpContext()
  const { currentEnv } = useEnvironmentContext()

  return (
    <Breadcrumb className="pb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={'/'} className="flex items-center gap-1">
              <HomeIcon className="inline w-4 h-4" />
              <span>Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {currentEnv && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to={`/env/$envSlug`}
                  params={{ envSlug: currentEnv.slug }}
                >
                  {currentEnv.displayName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        {currentFlagship && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  {...getEhToOptions({
                    appId: getFlashipResource(currentFlagship).slug,
                    envId: currentEnv?.slug,
                  })}
                >
                  {currentFlagship.displayName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        {currentResourceJump && !isFlagshipResource(currentResourceJump) && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  {...getEhToOptions({
                    appId: currentResourceJump.slug,
                    envId: currentEnv?.slug,
                  })}
                >
                  {currentResourceJump.displayName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
