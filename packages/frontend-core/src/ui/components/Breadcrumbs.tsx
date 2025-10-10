import { Link, useMatches } from '@tanstack/react-router'
import { ChevronRight, Home } from 'lucide-react'
import * as React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/ui/breadcrumb'

export interface BreadcrumbMeta {
  title: string
  href?: string
}

/**
 * Universal breadcrumb component that reads from route staticData
 * Routes can define breadcrumbs via the `staticData` property:
 * 
 * @example
 * ```tsx
 * export const Route = createFileRoute('/admin/chat')({
 *   component: ChatPage,
 *   staticData: {
 *     breadcrumb: { title: 'Chat' }
 *   }
 * })
 * ```
 */
export function Breadcrumbs() {
  const matches = useMatches()

  // Build breadcrumb trail from route matches
  const breadcrumbs: Array<{ title: string; href?: string }> = []

  // Always add home
  breadcrumbs.push({ title: 'Home', href: '/' })

  // Process each route match
  for (const match of matches) {
    const staticData = match.staticData as { breadcrumb?: BreadcrumbMeta } | undefined
    if (staticData?.breadcrumb) {
        // Check if this match has loaderData with app info for dynamic title
        const loaderData = match.loaderData as { app?: { displayName: string } | null } | undefined
        const dynamicTitle = loaderData?.app?.displayName
      
      breadcrumbs.push({
          title: dynamicTitle || staticData.breadcrumb.title,
        href: staticData.breadcrumb.href ?? match.pathname,
      })
    }
  }

  // Don't show breadcrumbs if only home
  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <Breadcrumb className="pb-4">
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <React.Fragment key={crumb.href ?? crumb.title}>
              {index > 0 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href} className="text-primary font-medium hover:text-foreground transition-colors">
                      {index === 0 ? (
                        <Home className="h-4 w-4" />
                      ) : (
                        crumb.title
                      )}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
