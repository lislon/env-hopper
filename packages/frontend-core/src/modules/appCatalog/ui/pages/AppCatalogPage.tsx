import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import type { AppForCatalog } from '@env-hopper/backend-core'
import { useAppCatalogContext } from '../../context/AppCatalogContext'
import { AppCatalogGrid } from '../grid/AppCatalogGrid'

import { Input } from '~/ui/input'

export function AppCatalogPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const search = useSearch({ strict: false })
  const { apps, isLoadingApps, tagsDefinitions } = useAppCatalogContext()
  const [searchValue, setSearchValue] = useState('')

  const filterTag = search.filterTag
  const selectedAppSlug = search.app

  const filteredApps = useMemo(() => {
    const normalizedSearchValue = searchValue.trim().toLowerCase()

    return apps
      .filter((app) => {
        if (normalizedSearchValue === '') {
          return true
        }
        const name = app.displayName.toLowerCase() || ''
        const slug = app.slug.toLowerCase() || ''
        const description = app.description?.toLowerCase() || ''
        const tags = app.tags?.join(' ').toLowerCase() || ''

        return (
          name.includes(normalizedSearchValue) ||
          slug.includes(normalizedSearchValue) ||
          description.includes(normalizedSearchValue) ||
          tags.includes(normalizedSearchValue)
        )
      })
      .filter((app) => {
        return (
          filterTag === undefined ||
          app.tags?.some((tag) => tag.toLowerCase() === filterTag.toLowerCase())
        )
      })
  }, [apps, searchValue, filterTag])

  const handleAppClick = (app: AppForCatalog) => {
    const currentPath = router.state.location.pathname
    navigate({ to: currentPath, search: { ...search, app: app.slug } })
  }

  const handleCloseDetails = () => {
    const currentPath = router.state.location.pathname
    const { app: _app, ...restSearch } = search
    navigate({ to: currentPath, search: restSearch })
  }

  if (isLoadingApps) {
    return <div className="py-6 text-muted-foreground">Loading…</div>
  }

  // Use first tag definition for grouping
  const groupingDefinition = tagsDefinitions[0]

  return (
    <div className="flex flex-col h-full">
      <div className="pb-4">
        <div className="flex items-start justify-between gap-4 pb-4">
          <div>
            <div className="font-medium text-2xl">App Catalog</div>
            <div className="text-sm text-muted-foreground">
              {filteredApps.length} apps available
            </div>
          </div>
        </div>

        <div className="w-full">
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search apps by name, description, or tags…"
            aria-label="Search apps"
          />
        </div>
      </div>

      <div className="flex-1">
        <AppCatalogGrid
          apps={filteredApps}
          selectedAppSlug={selectedAppSlug}
          groupingDefinition={groupingDefinition}
          onAppClick={handleAppClick}
          onCloseDetails={handleCloseDetails}
        />
      </div>
    </div>
  )
}
