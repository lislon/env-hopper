import { pick } from 'radashi'
import { useState } from 'react'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible'
import { Label } from '~/components/ui/label'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'

const ContextDebug: React.FC = () => {
  const ctxE = useEnvironmentContext()
  const ctxRj = useResourceJumpContext()

  const [showCurrentResourceJump, setCurrentResourceJump] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const showElements: Array<keyof typeof ctxRj> = [];
  if (showCurrentResourceJump) {
    showElements.push('currentResourceJump')
  }

  const ctx = {
              ...pick(ctxRj, showElements),
            };
            if (showHistory) {
              ctx.resHistory = ctxRj.history.slice(0, 3);
              ctx.envHistory = ctxE.history.slice(0, 3);
            }


  return (
    <Collapsible>
      <CollapsibleTrigger>Debug</CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Checkbox id="terms" checked={showCurrentResourceJump} onClick={() => setCurrentResourceJump(!showCurrentResourceJump)}  />
            <Label htmlFor="terms">Current ResouceJump</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="terms" checked={showHistory} onClick={() => setShowHistory(!showHistory)}  />
            <Label htmlFor="terms">History</Label>
          </div>

        </div>
        <pre>
          {JSON.stringify( ctx, null, 2,
          )}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default ContextDebug
