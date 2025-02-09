import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface VersionWidgetProps {
  version?: string
  diffCommits?: number
  diffDays?: number
}

export function VersionWidget({
  version = 'v1.13.0',
  diffCommits = 2,
  diffDays = 5,
}: VersionWidgetProps) {
  return (
    <Card className="h-32">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">Version</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-between h-full px-3 pb-3">
        <p className="text-lg font-semibold">{version}</p>
        <p className="text-xs flex items-center text-muted-foreground">
          <ArrowUpRight className="h-4 w-4 mr-1 text-green-600" />+{diffCommits}{' '}
          commits • {diffDays}d ahead
        </p>
      </CardContent>
    </Card>
  )
}
