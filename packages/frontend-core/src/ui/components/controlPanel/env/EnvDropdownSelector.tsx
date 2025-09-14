import { BaseDropdownSelector } from '../BaseDropdownSelector'
import { EnvDropdownContent } from './EnvDropdownContent'
import { useEnvironmentContext } from '~/modules/environment/EnvironmentContext'

export function EnvDropdownSelector() {
  const { currentEnv, setCurrentEnv } = useEnvironmentContext()

  const handleSelect = (envSlug: string) => {
    setCurrentEnv(envSlug)
  }

  return (
    <BaseDropdownSelector
      value={currentEnv?.displayName}
      placeholder="Select Env"
      onSelect={handleSelect}
    >
      {(props) => <EnvDropdownContent {...props} />}
    </BaseDropdownSelector>
  )
}
