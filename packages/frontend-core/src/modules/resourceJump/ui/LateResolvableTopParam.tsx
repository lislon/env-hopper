import { ChevronDown } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { ButtonGroup } from '~/components/ui/button-group'
import { cn } from '~/lib/utils'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { LateResolvableParamInput } from '~/modules/resourceJump/ui/LateResolvableSingleParam'

interface LateResolvableParamsInputProps {
  className?: string
  placeholder?: string
  label: string
  mostRelevantSlug: string|undefined
}

export function LateResolvableParamsInput({
  className,
  label,
  placeholder,
  mostRelevantSlug,
}: LateResolvableParamsInputProps) {
  const {currentResourceJump } = useResourceJumpContext()
  if (!currentResourceJump) {
    return null
  }
  return (
    <div
      className={cn(
        'flex flex-col gap-2 items-center',
        className,
      )}
    >
      {mostRelevantSlug && (
      <ButtonGroup>
        <LateResolvableParamInput paramSlug={mostRelevantSlug} />
        {/* <Input type="text" placeholder={placeholder} /> */}
        <Button variant="outline" aria-label="Search">
          <ChevronDown />
        </Button>
      </ButtonGroup>)}
      {/* <Link
        to={'/env/$envSlug/app/$appSlug'}
        params={{ appSlug: 'flagship-app', envSlug: 'flagship-resource-jump' }}
        className='inline-flex items-center gap-1'
      >
        RM Support Review Case
        <ExternalLinkIcon className="w-3 h-3" />
      </Link> */}
    </div>
  )
}
