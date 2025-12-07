import { useEffect, useRef } from 'react'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'

export interface MiniEnvSelectorPopoverProps {
  initialValue?: string
  onValueChange?: (value: string) => void
  onOpenChange?: (open: boolean) => void
  inputRef?: React.RefObject<HTMLInputElement|null>
}

export function MiniEnvSelectorPopover({
  onOpenChange,
  initialValue,
  onValueChange,
  inputRef
}: MiniEnvSelectorPopoverProps) {
  const { environments, setCurrentEnv } = useEnvironmentContext()
  const ref = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (inputRef?.current && initialValue) {
      inputRef.current.value = initialValue
    }
  }, [inputRef, initialValue])

  const selectEnv = (envSlug: string) => {
    setCurrentEnv(envSlug)
    // if (ref.current) {
    //   onValueChange?.(ref.current.value);
    // }
    onOpenChange?.(false)
  }

  // useEffect(() => {
  //   if (ref.current && onValueChange) {
  //     const r = ref.current
  //     return () => {
  //       onValueChange(r.value)
  //     }
  //   }
  // }, [ref, onValueChange])

  return (
    <Command>
      <CommandInput placeholder="Type environement name" defaultValue="a" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {environments.slice(0, 7).map((env) => (
          <CommandItem key={env.slug} onSelect={() => selectEnv(env.slug)}>
            {env.displayName}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  )
}
