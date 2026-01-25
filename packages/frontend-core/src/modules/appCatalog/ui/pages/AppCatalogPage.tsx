import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import type { AppForCatalog } from '@env-hopper/backend-core'
import { useAppCatalogContext } from '../../context/AppCatalogContext'
import { AppDetailModal } from '../components/AppDetailModal'
import { AppCatalogGrid } from '../grid/AppCatalogGrid'

import { Input } from '~/ui/input'

export function AppCatalogPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const search = useSearch({ strict: false })
  const { apps, isLoadingApps } = useAppCatalogContext()
  const [searchValue, setSearchValue] = useState('')

  const filteredApps = useMemo(() => {
    const normalizedSearchValue = searchValue.trim().toLowerCase()
    if (!normalizedSearchValue) {
      return apps
    }

    return apps.filter((app) => {
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
  }, [apps, searchValue])

  const handleAppClick = (app: AppForCatalog) => {
    if (app.slug) {
      const currentPath = router.state.location.pathname
      navigate({ to: currentPath, search: { app: app.slug } })
    }
  }

  const handleCloseModal = () => {
    const currentPath = router.state.location.pathname
    const { app: _app, ...restSearch } = search
    navigate({ to: currentPath, search: restSearch })
  }

  if (isLoadingApps) {
    return <div className="py-6 text-muted-foreground">Loading…</div>
  }

  const selectedAppSlug = search.app
  const selectedApp = selectedAppSlug
    ? apps.find((a) => a.slug === selectedAppSlug)
    : null

  return (
    <div className="py-6 flex flex-col gap-4 w-full max-w-7xl">
      <div className="flex items-start justify-between gap-4">
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

      <AppCatalogGrid apps={filteredApps} onAppClick={handleAppClick} />

      {selectedApp && (
        <AppDetailModal
          app={selectedApp}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
