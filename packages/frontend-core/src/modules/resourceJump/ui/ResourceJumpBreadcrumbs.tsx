import { Link } from '@tanstack/react-router'
import { HomeIcon } from 'lucide-react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
} from '~/components/ui/breadcrumb'
import { useEnvironmentContext } from '~/modules/environment/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/ResourceJumpContext'

export function ResourceJumpBreadcrubms() {
  const { currentFlagship } = useResourceJumpContext()
  const { currentEnv } = useEnvironmentContext()

  return <Breadcrumb>
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
      {currentFlagship && currentEnv && (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to={`/env/$envSlug/app/$appSlug`}
                params={{
                  envSlug: currentFlagship.slug,
                  appSlug: currentFlagship.slug
                }}
              >
                {currentFlagship.displayName}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </>
      )}
    </BreadcrumbList>
  </Breadcrumb>
}