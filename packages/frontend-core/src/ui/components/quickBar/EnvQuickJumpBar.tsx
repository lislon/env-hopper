import { Globe, Package, Server } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'
import { useEnvironmentContext } from '~/modules/environment/EnvironmentContext'

interface EnvQuickJumpBarProps {
  className?: string
}

// Environment color mapping
const getEnvironmentColor = (envSlug: string) => {
  if (envSlug.includes('cross')) return 'text-blue-600'
  if (envSlug.includes('preprod')) return 'text-orange-600'
  if (envSlug.includes('g64')) return 'text-violet-600'
  return 'text-gray-600'
}

// Environment icon mapping
const getEnvironmentIcon = (envSlug: string) => {
  if (envSlug.includes('cross')) return Package
  if (envSlug.includes('prod')) return Globe
  return Server
}

export function EnvQuickJumpBar({ className }: EnvQuickJumpBarProps) {
  const indexData = useBootstrapConfig()
  const { setCurrentEnv, currentEnv } = useEnvironmentContext()

  // Get first 3-4 real environments from context data
  const environments = Object.values(indexData.envs)
    .slice(0, 4)
    .map((env) => ({
      slug: env.slug,
      label: env.displayName || env.slug,
      icon: getEnvironmentIcon(env.slug),
      color: getEnvironmentColor(env.slug),
    }))

  const onClick = (environment: string) => {
    setCurrentEnv(environment)
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {environments.map((env) => {
        const Icon = env.icon
        const isActive = env.slug === currentEnv?.slug

        return (
          <Button
            key={env.slug}
            variant={'ghost'}
            onClick={() => onClick(env.slug)}
            className={`justify-start
                ${isActive ? 'bg-accent text-accent-foreground font-medium' : ''}
              `}
          >
            <Icon className={`w-4 h-4 ${env.color} flex-shrink-0`} />
            {env.label}
          </Button>
        )
      })}
    </div>
  )
}
