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
import { buildInstructions, buildToolDescriptions } from './instructions'
import type { McpToolName, PerTool, WhenNames } from './instructions'
import { toolCallEvent } from './toolCallEvent'
import type { McpToolCallEvent } from './toolCallEvent'
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
  /** This deployment's env and object names, for the WHEN-only server instructions. */
  when?: WhenNames
  /** Per tool, `"user words" -> {args}` lines in this deployment's names. */
  examples?: PerTool
  /** Per tool, anything else this deployment's agents get wrong. */
  notes?: PerTool
  /** The UI's public origin for `ehUrl`; by default the request's own. */
  publicUrl?: string
  /** Called once per tool call, after the result is built; a throw is swallowed. */
  onToolCall?: (event: McpToolCallEvent) => void
}

/** The one line a person reads; the description, built per request, is what the model reads. */
const TITLES = {
  get_url: 'Link to a page in an app, for an env or env-less',
  get_login: 'Test logins for an app on an env',
  get_database_access: 'DB connection for an app on an env',
  list_apps: 'Apps, their pages and the ids each page takes',
  list_envs: 'Envs, and where an app is deployed with version',
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

async function createServer(
  options: CreateMcpHandlerOptions,
  req: Request | undefined,
): Promise<McpServer> {
  const origin = originOf(req)
  const client = req?.headers.get('user-agent') ?? null
  const { backend, catalog = null } = options
  const [bootstrap, jumps] = await Promise.all([
    backend.getBootstrapData(),
    backend.getResourceJumps(),
  ])
  const data = toMcpData(bootstrap, jumps, options.publicUrl ?? origin)

  const server = new McpServer(
    { name: 'env-hopper', version: bootstrap.appVersion ?? '0.0.0' },
    {
      instructions: buildInstructions({ when: options.when }),
    },
  )
  const descriptions = buildToolDescriptions({
    params: jumps.lateResolvableParams,
    examples: options.examples,
    notes: options.notes,
  })
  const tool = (name: keyof typeof TITLES) => ({
    title: TITLES[name],
    description: descriptions[name],
  })
  const appEnv = {
    app: z.string().describe('App name, fuzzy'),
    env: z.string().describe('Env name, fuzzy'),
  }
  /** Runs a tool, reports the call to onToolCall, and replies with its JSON. */
  const handle =
    <TArgs extends Record<string, unknown>>(
      name: McpToolName,
      run: (args: TArgs) => object | Promise<object>,
    ) =>
    async (args: TArgs) => {
      const started = Date.now()
      const result = await run(args)
      try {
        options.onToolCall?.(
          toolCallEvent(name, args, result, {
            client,
            durationMs: Date.now() - started,
          }),
        )
      } catch {
        // Telemetry never breaks the call.
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      }
    }

  server.registerTool(
    'get_url',
    {
      ...tool('get_url'),
      inputSchema: z.object({
        env: z.string().optional(),
        app: z.string().optional(),
        jump: z.string().optional(),
        params: z.record(z.string(), z.string()).optional(),
      }),
    },
    handle('get_url', (args) => getUrl(data, args)),
  )
  server.registerTool(
    'get_login',
    {
      ...tool('get_login'),
      inputSchema: z.object(appEnv),
    },
    handle('get_login', (args) => getLogin(data, args)),
  )
  server.registerTool(
    'get_database_access',
    {
      ...tool('get_database_access'),
      inputSchema: z.object(appEnv),
    },
    handle('get_database_access', (args) => getDatabaseAccess(data, args)),
  )
  server.registerTool(
    'list_apps',
    {
      ...tool('list_apps'),
      inputSchema: z.object({ query: z.string().optional() }),
    },
    handle('list_apps', (args) => listApps(data, args)),
  )
  server.registerTool(
    'list_envs',
    {
      ...tool('list_envs'),
      inputSchema: z.object({
        query: z.string().optional(),
        app: z.string().optional(),
      }),
    },
    handle('list_envs', (args) => listEnvs(data, catalog, args)),
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
    createSdkMcpHandler((ctx) => createServer(options, ctx.requestInfo)),
  )
  return (
    req: IncomingMessage & { body?: unknown },
    res: ServerResponse,
  ): Promise<void> => handler(req, res, req.body)
}
