import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '~/ui/card'

export function AdminWelcome() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Assistant</h1>
      <p className="text-muted-foreground mb-6">
        Welcome to the AI-powered admin interface. You can use natural language
        to manage your application.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What you can do</CardTitle>
          <CardDescription>
            Try these example commands to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Show me contents of the Apps table in DB</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Add a new app called "Portal" with icon "portal"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>List all configured data sources</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Configure a new MCP server</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Type your request in the chat below to get started.
      </p>
    </div>
  )
}
