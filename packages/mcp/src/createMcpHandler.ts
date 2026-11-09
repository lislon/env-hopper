import type { IncomingMessage, ServerResponse } from 'node:http'
import { toNodeHandler } from '@modelcontextprotocol/node'
import {
  McpServer,
  createMcpHandler as createSdkMcpHandler,
} from '@modelcontextprotocol/server'
import { z } from 'zod'
import type {
  Catalog,
  EhBackendCompanySpecificBackend,
} from '@env-hopper/backend-core'
import { buildInstructions } from './instructions'
import { toMcpData } from './mcpData'
import {
  getDatabaseAccess,
  getLogin,
  getUrl,
  listApps,
  listEnvs,
} from './tools'

export interface CreateMcpHandlerOptions {
  backend: EhBackendCompanySpecificBackend
  /** The deployment catalog, for list_envs with an app; null: deployments untracked. */
  catalog?: Catalog | null
  /** Instruction lines: `"user words" -> tool {args}`, in this deployment's names. */
  examples?: Array<string>
  /** Instruction lines for anything else this deployment's agents should know. */
  notes?: Array<string>
  /** The UI's public origin for `ehUrl`; by default the request's own. */
  publicUrl?: string
}

/** `title`: the one line a person reads; `description`: what the model reads. */
const TOOLS = {
  get_url: {
    title: 'Link to a page in an app, for an env or env-less',
    description:
      'Link to a page in an app. Any subset of args works: params alone finds the jumps that take them. env/app/jump/param names fuzzy. params = {paramName: value}.',
  },
  get_login: {
    title: 'Test logins for an app on an env',
    description:
      'UI logins for app on env: "logins" [{label, desc, username, password}] ([] = none), or "requestAccess" {url} on envs without shared logins (prod).',
  },
  get_database_access: {
    title: 'DB connection for an app on an env',
    description:
      'DB connection for app on env: "databases" [{url, host, port, database, username, password}] ([] = none), or "requestAccess" {url}.',
  },
  list_apps: {
    title: 'Apps, their pages and the ids each page takes',
    description:
      'Apps with their jumps (and params each jump takes), and whether login/database exist. query matches app, jump and param names.',
  },
  list_envs: {
    title: 'Envs, and where an app is deployed with version',
    description:
      "Envs with credentials kind. With app: only envs where it is deployed, with version and health; deployedTracked:false = EH does not track this app's deployments (absent != not deployed).",
  },
}

function originOf(req: Request | undefined): string {
  if (!req) return ''
  const url = new URL(req.url)
  const proto =
    req.headers.get('x-forwarded-proto')?.split(',')[0] ??
    url.protocol.replace(':', '')
  const host = req.headers.get('x-forwarded-host') ?? url.host
  return `${proto}://${host}`
}

function reply(result: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result) }],
  }
}

async function createServer(
  options: CreateMcpHandlerOptions,
  origin: string,
): Promise<McpServer> {
  const { backend, catalog = null } = options
  const [bootstrap, jumps] = await Promise.all([
    backend.getBootstrapData(),
    backend.getResourceJumps(),
  ])
  const data = toMcpData(bootstrap, jumps, options.publicUrl ?? origin)

  const server = new McpServer(
    { name: 'env-hopper', version: bootstrap.appVersion ?? '0.0.0' },
    {
      instructions: buildInstructions({
        params: jumps.lateResolvableParams,
        examples: options.examples,
        notes: options.notes,
      }),
    },
  )
  const appEnv = {
    app: z.string().describe('App name, fuzzy'),
    env: z.string().describe('Env name, fuzzy'),
  }

  server.registerTool(
    'get_url',
    {
      ...TOOLS.get_url,
      inputSchema: z.object({
        env: z.string().optional(),
        app: z.string().optional(),
        jump: z.string().optional(),
        params: z.record(z.string(), z.string()).optional(),
      }),
    },
    (args) => reply(getUrl(data, args)),
  )
  server.registerTool(
    'get_login',
    {
      ...TOOLS.get_login,
      inputSchema: z.object(appEnv),
    },
    (args) => reply(getLogin(data, args)),
  )
  server.registerTool(
    'get_database_access',
    {
      ...TOOLS.get_database_access,
      inputSchema: z.object(appEnv),
    },
    (args) => reply(getDatabaseAccess(data, args)),
  )
  server.registerTool(
    'list_apps',
    {
      ...TOOLS.list_apps,
      inputSchema: z.object({ query: z.string().optional() }),
    },
    (args) => reply(listApps(data, args)),
  )
  server.registerTool(
    'list_envs',
    {
      ...TOOLS.list_envs,
      inputSchema: z.object({
        query: z.string().optional(),
        app: z.string().optional(),
      }),
    },
    async (args) => reply(await listEnvs(data, catalog, args)),
  )
  return server
}

/**
 * The MCP endpoint over Streamable HTTP, stateless: a fresh server per
 * request, over the backend's current data. Mount it for POST, e.g.
 * `app.post('/api/mcp', createMcpHandler({ backend }))`; a parsed JSON body
 * on `req.body` is used when present.
 */
export function createMcpHandler(options: CreateMcpHandlerOptions) {
  const handler = toNodeHandler(
    createSdkMcpHandler((ctx) =>
      createServer(options, originOf(ctx.requestInfo)),
    ),
  )
  return (
    req: IncomingMessage & { body?: unknown },
    res: ServerResponse,
  ): Promise<void> => handler(req, res, req.body)
}
