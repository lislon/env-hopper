import {
  LayoutGridIcon
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '~/components/ui/select'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { ResourceJumpBreadcrubms } from '~/modules/resourceJump/ui/ResourceJumpBreadcrumbs'




export function CenterColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl w-full">
      <div className=" mb-4 flex gap-4">
        <FlagshipResourceJumpSelector className="w-64" />
        {/* <AppSwitcher /> */}
        {/* <Select>
          <SelectTrigger>View: Jump</SelectTrigger>
          <SelectContent>
            <SelectItem value={'default'}> Pages </SelectItem>
            <SelectItem value={'dev-info'}> Developer Info</SelectItem>
            <SelectItem value={'logs'}>Logs</SelectItem>
            <SelectItem value={'documentation'}>Documnentation</SelectItem>
            <SelectItem value={'config-server'}>Config Server</SelectItem>
          </SelectContent>
        </Select> */}
        {/* <InputGroup>
          <InputGroupInput
            placeholder="Context..."
            className="text-orange-50 border-orange-500"
          />
          <InputGroupAddon align={'inline-end'} className='text-amber-400' >
            <AsteriskIcon className='stroke-amber-400' />
            Context
          </InputGroupAddon>
        </InputGroup> */}
      </div>
      <ResourceJumpBreadcrubms className='pb-4' />
      {children}
      {/* <Tabs defaultValue="account" className="w-[400px]">
        <TabsList defaultValue="pages">
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="dev-info">Dev info</TabsTrigger>
        </TabsList>
        <TabsContent value="pages">
        </TabsContent>
        <TabsContent value="dev-info">Links for developer</TabsContent>
      </Tabs> */}
    </div>
  )
}

function FlagshipResourceJumpSelector({ className }: { className?: string }) {
  const { currentFlagship, setCurrentFlagship, flagshipJumpResources } =
    useResourceJumpContext()

  return (
    <Select onValueChange={setCurrentFlagship}>
      <SelectTrigger>
        <span
          className={`text-lg flex text-eh-app-foreground gap-4 items-center ${className ?? 'w-64'}`}
        >
          <LayoutGridIcon className="stroke-eh-app-foreground" />
          <span>{currentFlagship?.displayName ?? 'Select Resource Jump'}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {flagshipJumpResources.slice(0, 5).map((env) => (
          <SelectItem key={env.slug} value={env.slug}>
            {env.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}