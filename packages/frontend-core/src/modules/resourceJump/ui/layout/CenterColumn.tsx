import { ResourceJumpBreadcrubms } from '~/modules/resourceJump/ui/ResourceJumpBreadcrumbs'
import { TopQuickJump } from '~/modules/resourceJump/ui/TopQuickJump'




export function CenterColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl w-full">
      <div className=" mb-4 flex gap-4">
        {/* <TopQuickJump /> */}

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
