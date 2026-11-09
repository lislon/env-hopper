# @env-hopper/mcp

An MCP server over a deployment's Env Hopper data: links to app pages on an env, shared test logins, database access, and where an app is deployed.

```ts
import express from 'express'
import { createMcpHandler } from '@env-hopper/mcp'

const mcp = createMcpHandler({
  backend, // the deployment's EhBackendCompanySpecificBackend
  catalog, // optional: the deployment catalog, for list_envs with an app
  examples: ['"case 12 on qa" -> get_url {env:"qa", params:{caseId:"12"}}'],
})
app.all('/api/mcp', (req, res) => void mcp(req, res))
```

Connect a client: `claude mcp add --transport http env-hopper https://<host>/api/mcp`.

Tools: `get_url`, `get_login`, `get_database_access`, `list_apps`, `list_envs`. Names are fuzzy; a result echoes what each name resolved to, and `null` with `options` when it matched nothing for sure.
