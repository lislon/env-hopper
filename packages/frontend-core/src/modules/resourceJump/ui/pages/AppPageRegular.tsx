import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { ResourceJumpButton } from '~/modules/resourceJump/ui/ResourceJumpButton'

export function AppPageRegular() {
  const { currentResourceJump } = useResourceJumpContext()
  const { currentEnv } = useEnvironmentContext()
  if (!currentResourceJump) {
    return <div>No Resource Jump selected</div>
  }
  return (
    <div className="flex flex-col gap-4 w-[600px]">
      <ResourceJumpButton resourceJump={currentResourceJump} env={currentEnv} />
    </div>
  )
}
