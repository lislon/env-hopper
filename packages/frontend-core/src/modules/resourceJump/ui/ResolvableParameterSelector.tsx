import { XIcon } from 'lucide-react'
import { debounce } from 'radashi'
import { useEffect, useMemo, useRef } from 'react'
import { useResourceJumpContext } from '../context/ResourceJumpContext'
import { cn } from '~/lib/utils'

interface ResolvableParameterSelectorProps {
  className?: string
  slug: string
  label?: string
}

export function ResolvableParameterSelector({
  className = '',
  slug,
  label,
}: ResolvableParameterSelectorProps) {
  const {
    currentLateResolvableParams,
    currentLateResolvableParamsValue,
    setLateResolvableParamValue,
  } = useResourceJumpContext()

  // Resolve display name from context if not provided
  const paramMeta = currentLateResolvableParams.find((p) => p.slug === slug)
  const displayLabel = label ?? paramMeta?.displayName ?? 'Parameter'

  // Find current value for this slug
  const currentValue =
    currentLateResolvableParamsValue.find((p) => p.slug === slug)?.value ?? ''

  const inputRef = useRef<HTMLInputElement | null>(null)

  // Debounced push to context with leading: true
  const pushToContext = useMemo(
    () =>
      debounce({ delay: 3000 }, (val: string) => {
        return setLateResolvableParamValue(slug, val)
      }),
    [slug, setLateResolvableParamValue],
  )

  useEffect(() => () => pushToContext.cancel(), [pushToContext])

  const handleChange = (newValue: string) => {
    pushToContext(newValue)
  }

  // Keep the uncontrolled input in sync when context changes externally
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== currentValue) {
      inputRef.current.value = currentValue
    }
  }, [currentValue])

  return (
    <div className={cn('w-full', className)}>
      <div className="relative group hover:cursor-pointer w-full">
        <input
          ref={inputRef}
          className={cn(
            'text-sm h-10 w-full rounded-md border border-input bg-background pl-4 pr-10 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'group-hover:border-secondary-foreground/60 group-hover:bg-secondary/30 focus:bg-secondary/30 focus:border-secondary-foreground/60',
            'hover:cursor-pointer duration-300',
          )}
          placeholder={displayLabel}
          defaultValue={currentValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => {
            const val = inputRef.current?.value ?? ''
            setLateResolvableParamValue(slug, val)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const val = inputRef.current?.value ?? ''
              setLateResolvableParamValue(slug, val)
              ;(e.currentTarget as HTMLInputElement).blur()
            }
          }}
          onMouseUp={(e) => {
            const userHasSelectedSomeText =
              e.currentTarget.selectionStart !== e.currentTarget.selectionEnd
            if (!userHasSelectedSomeText) {
              e.currentTarget.select()
            }
          }}
        />
        <XIcon
          className="absolute right-3 top-1/2 -translate-y-1/2 stroke-secondary-foreground/50 group-hover:stroke-secondary-foreground/60 group-hover:rotate-3 group-hover:scale-95 hover:stroke-secondary-foreground hover:bg-secondary rounded-full"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.value = ''
            }
            handleChange('')
          }}
        />
        <label
          className={cn(
            'absolute text-xs text-secondary-foreground/50',
            'left-2 -top-0.5 -translate-y-1/2 text-muted-foreground bg-background rounded-2xl px-1',
          )}
        >
          {displayLabel}
        </label>
      </div>
    </div>
  )
}
