import { Server } from 'lucide-react'
import type { BaseDropdownContentProps, EhEnvIndexed } from '~/types/ehTypes'
import { Badge } from '~/components/ui/badge'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'

interface EnvDropdownContentProps extends BaseDropdownContentProps {}

export function EnvDropdownContent({
  searchValue = '',
  onSelect,
  getItemProps,
  highlightedIndex = -1,
  isUntouched,
}: EnvDropdownContentProps) {
  const indexData = useBootstrapConfig()
  const listEnvs = Object.values(indexData.envs)

  // Filter environments based on search value
  const filteredEnvs = listEnvs.filter((env) => {
    if (isUntouched) {
      return true
    }
    return (
      env.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
      env.slug.toLowerCase().includes(searchValue.toLowerCase())
    )
  })

  // Get environment type for styling
  const getEnvType = (slug: string) => {
    if (slug.includes('prod')) return 'production'
    if (slug.includes('preprod') || slug.includes('staging')) return 'staging'
    if (slug.includes('dev') || slug.includes('int')) return 'development'
    return 'other'
  }

  // Get badge variant based on environment type
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'production':
        return 'destructive'
      case 'staging':
        return 'secondary'
      case 'development':
        return 'default'
      default:
        return 'outline'
    }
  }

  // Get environment color
  const getEnvColor = (slug: string) => {
    if (slug.startsWith('cross')) return 'text-blue-600'
    if (slug.startsWith('preprod')) return 'text-orange-600'
    if (slug.startsWith('g64')) return 'text-violet-600'
    return 'text-gray-600'
  }

  const handleEnvSelect = (env: EhEnvIndexed) => {
    if (onSelect) {
      onSelect(env.slug)
    }
  }

  if (filteredEnvs.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No environments found for "{searchValue}"
      </div>
    )
  }

  return (
    <div className="max-h-[300px] overflow-y-auto">
      {filteredEnvs.map((env, index) => {
        const envType = getEnvType(env.slug)
        const isHighlighted = highlightedIndex === index

        return (
          <div
            key={env.slug}
            {...(getItemProps
              ? getItemProps({
                  item: env.slug,
                  index,
                  onClick: () => handleEnvSelect(env),
                })
              : {})}
            className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
              isHighlighted
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className={`font-medium ${getEnvColor(env.slug)}`}>
                  {env.displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {env.slug}
                </span>
              </div>
            </div>
            <Badge variant={getBadgeVariant(envType)} className="text-xs">
              {envType}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
