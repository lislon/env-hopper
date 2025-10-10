import {
    GlobeIcon,
    HeartPlusIcon
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '~/components/ui/popover'
import {
    useEnvironmentContext
} from '~/modules/environment/EnvironmentContext'
import {
    useResourceJumpContext
} from '~/modules/resourceJump/ResourceJumpContext'
import { EnvSwitcher } from '~/modules/resourceJump/ui/EnvSwitcher'
import { MiniEnvSelectorPopover } from '~/modules/resourceJump/ui/miniEnvSelector/MiniEnvSelectorPopover'



export function LeftColumn() {
  const { currentEnv, setCurrentEnv, environments } = useEnvironmentContext()
  const { setCurrentResourceJumpSlug } = useResourceJumpContext()

  const [open, setOpen] = useState(false)

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
  }

  return (
    <div className='flex flex-col gap-2'>
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
        <PopoverContent>
          <MiniEnvSelectorPopover onOpenChange={onOpenChange} />
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
      <div className='mt-4'>
        <EnvSwitcher />
      </div>
    </div>
  )
}
