import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList
} from '~/components/ui/command';
import { useEnvironmentContext } from '~/modules/environment/EnvironmentContext';

export interface MiniEnvSelectorPopoverProps {
    onOpenChange?: (open: boolean) => void;
}

export function MiniEnvSelectorPopover({ onOpenChange }: MiniEnvSelectorPopoverProps) {
  const { environments, setCurrentEnv } = useEnvironmentContext()

  const selectEnv = (envSlug: string) => {
    setCurrentEnv(envSlug)
    onOpenChange?.(false)
  }

  return (
    <Command>
      <CommandInput placeholder="Type environement name" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
          {environments.slice(0, 7).map((env) => (
            <CommandItem
              key={env.slug}
              onSelect={() => selectEnv(env.slug)}
            >
              {env.displayName}
            </CommandItem>
          ))}
      </CommandList>
    </Command>
  )
}
