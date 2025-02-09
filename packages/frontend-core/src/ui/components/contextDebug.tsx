import { useEnvironmentContext } from '~/modules/environment/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/ResourceJumpContext'

const ContextDebug: React.FC = () => {
  const { currentResourceJump } = useResourceJumpContext()
  const { currentEnv } = useEnvironmentContext()

  return (
    <pre>{JSON.stringify({ currentResourceJump, currentEnv }, null, 2)}</pre>
  )
}

export default ContextDebug
