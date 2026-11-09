import { createFileRoute } from '@tanstack/react-router'
import { useLegacyCustomization } from '~/legacy/adapter/legacyApi'
import { McpPage } from '~/modules/mcp/McpPage'
import { DEFAULT_MCP_SERVER_NAME } from '~/modules/mcp/mcpSetup'

export const Route = createFileRoute('/_layout/mcp')({
  component: RouteComponent,
})

function RouteComponent() {
  const { mcpServerName } = useLegacyCustomization()
  return <McpPage serverName={mcpServerName || DEFAULT_MCP_SERVER_NAME} />
}
