import { pick } from 'radashi'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import { useResourceJumpContext } from '~/modules/resourceJump/ResourceJumpContext'

const ContextDebug: React.FC = () => {
  const p = useResourceJumpContext()

  return (
    <Collapsible>
      <CollapsibleTrigger>Debug</CollapsibleTrigger>
      <CollapsibleContent>
        <pre>{JSON.stringify(pick(p, ['currentResourceJump', 'currentFlagship']), null, 2)}</pre>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default ContextDebug
