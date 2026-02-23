import { Button } from '~/ui/button'
import { Card, CardContent } from '~/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/ui/tabs'

export interface GroupingTabsProps {
  className?: string
}

export function GroupingTabs(props: GroupingTabsProps) {
  return (
    <Tabs defaultValue="overview" className={props.className}>
      <TabsList defaultValue={'yDepartments'}>
        <TabsTrigger value="byDepartments">By Departments</TabsTrigger>
        {/* <TabsTrigger value="analytics">Analytics</TabsTrigger>*/}
        {/* <TabsTrigger value="reports">Reports</TabsTrigger>*/}
        {/* <TabsTrigger value="settings">Settings</TabsTrigger>*/}
      </TabsList>
      <TabsContent value="byDepartments">
        <Card>
          <CardContent className="text-muted-foreground text-sm flex gap-4">
            <MiniCard>Development</MiniCard>
            <MiniCard>Sales</MiniCard>
            <MiniCard>Operations</MiniCard>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

export interface MiniCardProps {
  children?: React.ReactNode
}

function MiniCard(props: MiniCardProps) {
  return (
    <Button className={'p-3 rounded aspect-square w-32 h-32'}>
      {props.children}
    </Button>
  )
}
