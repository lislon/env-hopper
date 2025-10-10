import { useResourceJumpContext } from '../ResourceJumpContext'
import { ResolvableParameterSelector } from './ResolvableParameterSelector'

interface ResolvableParametersProps {
  className?: string
}

export function ResolvableParameters({
  className = '',
}: ResolvableParametersProps) {
  const { currentLateResolvableParams } = useResourceJumpContext()

  if (currentLateResolvableParams.length === 0) {
    return null
  }

  return (
    <div className={className}>
      {currentLateResolvableParams.map((p) => (
        <div key={p.slug} className="pt-2 w-full">
          <ResolvableParameterSelector slug={p.slug} label={p.displayName} />
        </div>
      ))}
    </div>
  )
}
