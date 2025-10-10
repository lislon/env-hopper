import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { SmoothSwitcher } from '~/modules/resourceJump/ui/SmoothSwitcher'
import { useMostRelevantQuickEnvs } from '~/modules/resourceJump/utils/statistics/useMostRelevantQuickEnvs'

export function EnvSwitcher() {
  const { currentEnv, setCurrentEnv } = useEnvironmentContext()

  const values = useMostRelevantQuickEnvs()

  return (
    <SmoothSwitcher
      values={values}
      selectedValueSlug={currentEnv?.slug}
      onValueSelect={setCurrentEnv}
    />
  )
}
