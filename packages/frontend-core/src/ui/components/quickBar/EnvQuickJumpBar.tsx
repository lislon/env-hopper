import { Globe, Package, Server } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'
import { useEnvironmentContext } from '~/modules/environment/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/ResourceJumpContext'

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
  const { quickEnvSlots } = useResourceJumpContext()

  const onClick = (environment: string) => {
    setCurrentEnv(environment)
  }

  const slots: Array<string | undefined> =
    quickEnvSlots.length === 7 ? quickEnvSlots : Array(7).fill(undefined)

  return (
    <div
      className={`flex flex-col gap-1 ${className}`}
      data-testid="env-quick-jump-section"
    >
      {slots.map((slug, index) => {
        if (!slug) {
          return (
            <Button
              key={`empty-${index}`}
              variant={'ghost'}
              disabled
              className={'justify-start text-muted-foreground text-xs'}
            >
              Empty
            </Button>
          )
        }
        const env = indexData.envs[slug]
        const label = env?.displayName || slug
        const Icon = getEnvironmentIcon(slug)
        const color = getEnvironmentColor(slug)
        const isActive = slug === currentEnv?.slug

        return (
          <Button
            key={`${slug}-${index}`}
            variant={'ghost'}
            onClick={() => onClick(slug)}
            className={`justify-start text-xs ${isActive ? 'bg-accent text-accent-foreground font-medium' : ''}`}
          >
            <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
            {label}
          </Button>
        )
      })}
    </div>
  )
}
