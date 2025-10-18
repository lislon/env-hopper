import { use } from 'react'
import { EnvironmentContext } from '~/modules/environment/EnvironmentContext'
import { ResourceJumpContext } from '~/modules/resourceJump/ResourceJumpContext'

const ContextDebug: React.FC = () => {
  const resourceJumpContext =  use(ResourceJumpContext)
  const envContext = use(EnvironmentContext)

  return (
    <pre>{JSON.stringify({ currentResourceJump: resourceJumpContext?.currentResourceJump, currentEnv: envContext?.currentEnv }, null, 2)}</pre>
  )
}

export default ContextDebug
