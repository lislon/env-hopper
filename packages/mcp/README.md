# @env-hopper/mcp

An MCP server over a deployment's Env Hopper data: links to app pages on an env, shared test logins, database access, and where an app is deployed.

```ts
import express from 'express'
import { createMcpHandler } from '@env-hopper/mcp'

const mcp = createMcpHandler({
  backend, // the deployment's EhBackendCompanySpecificBackend
  catalog, // optional: the deployment catalog, for list_envs with an app
  // optional: names for the server instructions, which say only when to use it
  when: { envs: ['qa', 'prod'], objects: ['a case'], request: 'crm case 12' },
  // optional, per tool: lines appended to that tool's description
  examples: { get_url: ['"case 12 on qa" -> {env:"qa", params:{caseId:"12"}}'] },
  notes: { get_login: ['Envs named *-sandbox are personal.'] },
  // optional: one event per tool call (args, resolved slugs, counts; never credentials)
  onToolCall: (event) => logger.info({ mcp: event }, 'mcp tool call'),
})
app.all('/api/mcp', (req, res) => void mcp(req, res))
```

Connect a client: `claude mcp add --transport http env-hopper https://<host>/api/mcp`.

The server instructions (loaded into every session) say only when to reach for the server; how to call each tool and read its result is in that tool's description (loaded when the tool is picked).

Tools: `get_url`, `get_login`, `get_database_access`, `list_apps`, `list_envs`. Names are fuzzy; a result echoes what each name resolved to, and `null` with `options` when it matched nothing for sure.
