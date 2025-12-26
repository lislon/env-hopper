import { GlobeIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { MiniEnvSelectorPopover } from '~/modules/resourceJump/ui/miniEnvSelector/MiniEnvSelectorPopover'
import { Button } from '~/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '~/ui/popover'

export function LeftColumn() {
  const { currentEnv } = useEnvironmentContext()
  const { leftEnvSelectorValue, setLeftEnvSelectorValue } =
    useResourceJumpContext()

  const [open, setOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setLeftEnvSelectorValue(inputRef.current?.value || '')
    }
    setOpen(isOpen)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* <MiniEnvSelectorPopover /> */}
      {/* <Select onValueChange={setCurrentEnv}>
        <SelectTrigger>
          <span
            className="text-lg flex text-eh-env-foreground gap-4 items-center w-48"
            // variant="ghost"
          >
            <GlobeIcon className="stroke-eh-env-foreground" />
            <span>
              {currentEnv ? currentEnv.displayName : 'No Environment Selected'}
            </span>
          </span>
        </SelectTrigger>
        <SelectContent>
          {environments.slice(0, 5).map((env) => (
            <SelectItem key={env.slug} value={env.slug}>
              {env.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select> */}
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            className="text-lg flex text-eh-env-foreground gap-4 justify-between min-w-[250px]"
            variant="outline"
          >
            <span>
              {currentEnv ? currentEnv.displayName : 'No Environment Selected'}
            </span>
            <GlobeIcon className="stroke-eh-env-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" sideOffset={-40} align="center">
          <MiniEnvSelectorPopover
            onOpenChange={onOpenChange}
            initialValue={leftEnvSelectorValue}
            onValueChange={setLeftEnvSelectorValue}
            inputRef={inputRef}
          />
        </PopoverContent>
      </Popover>
      <div className="flex flex-col gap-4">
        <div className="text-muted-foreground text-xs p-1 mt-1">
          PSPC Testing Environment
        </div>
        {/* <div>
          <div className="flex flex-col items-center">
            <div className="font-semibold">
              {currentEnv ? currentEnv.displayName : 'No Environment Selected'}
            </div>
            <div className="text-muted-foreground text-xs">
              PSPC Testing Environment
            </div>
          </div>
        </div>
        <div>
          <GlobeIcon className="stroke-eh-env-foreground" />
        </div> */}
      </div>
      {/* <div className="mt-4">
        <EnvSwitcher />
      </div> */}
    </div>
  )
}
