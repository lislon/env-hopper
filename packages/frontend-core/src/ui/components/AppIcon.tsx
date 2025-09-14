import { useState } from 'react'
import { Package } from 'lucide-react'
import type { EhAppIndexed } from '@env-hopper/backend-core'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'

interface AppIconProps {
  app: EhAppIndexed
  className?: string
}

export function AppIcon({ app, className = 'w-4 h-4' }: AppIconProps) {
  const { appsMeta } = useBootstrapConfig()
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  // Determine icon source with fallback chain:
  // 1. app.iconName -> /static/icon/${iconName}
  // 2. indexData.appsMeta.defaultIcon -> /static/icon/${defaultIcon}
  // 3. Package icon (default)
  const getIconSrc = (): string | null => {
    if (app.iconName) {
      return `/static/icon/${app.iconName}`
    }
    if (appsMeta.defaultIcon) {
      return `/static/icon/${appsMeta.defaultIcon}`
    }
    return null
  }

  const iconSrc = getIconSrc()

  // Use icon if available and no error, otherwise fallback to Package icon
  if (iconSrc && !imageError) {
    return (
      <img
        src={iconSrc}
        alt={`${app.displayName} icon`}
        className={className}
        onError={handleImageError}
      />
    )
  }

  return <Package className={className} />
}
