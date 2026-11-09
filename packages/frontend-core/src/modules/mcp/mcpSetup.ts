/**
 * What the MCP page needs from the server, read with raw `fetch` rather than
 * the MCP SDK: one unauthenticated `tools/list` and nothing else.
 *
 * The endpoint is stateless (a fresh server per request), so `tools/list`
 * stands alone with no `initialize` handshake. It may answer with JSON or a
 * single SSE event, so both are parsed.
 */

export interface McpToolParameter {
  name: string
  type?: string
  required: boolean
  description?: string
  enumValues?: Array<string>
}

export interface McpTool {
  name: string
  /** The one line a person reads. */
  title?: string
  /** What the model reads. */
  description?: string
  parameters: Array<McpToolParameter>
}

/** Path the MCP server is mounted at, relative to the site origin. */
export const MCP_ENDPOINT_PATH = '/api/mcp'

/** Name the server is shown under in the user's MCP client. */
export const DEFAULT_MCP_SERVER_NAME = 'env-hopper'

/** Plain words to paste into any agent chat; one line. */
export function installText(serverName: string, endpoint: string): string {
  return `Please install the ${serverName} MCP server for me. It is a remote HTTP MCP server at ${endpoint}; add it under the name ${serverName}.`
}

interface JsonSchemaProperty {
  type?: string | Array<string>
  description?: string
  enum?: Array<unknown>
  items?: { type?: string | Array<string>; enum?: Array<unknown> }
}

const joinType = (t: string | Array<string> | undefined) =>
  Array.isArray(t) ? t.join(' | ') : t

function describeType(prop: JsonSchemaProperty): string | undefined {
  const base = joinType(prop.type)
  if (base !== 'array') return base
  const item = joinType(prop.items?.type)
  return item ? `${item}[]` : 'array'
}

/** Pull the single JSON-RPC payload out of a JSON or SSE response body. */
function parseBody(contentType: string, body: string): unknown {
  if (!contentType.includes('text/event-stream')) return JSON.parse(body)
  const data = body
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trim())
  if (data.length === 0) throw new Error('empty response')
  return JSON.parse(data.join(''))
}

/** Throws an Error whose message is the short reason: a status, or what failed. */
async function rpc<T>(
  origin: string,
  method: string,
  params: object,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${origin}${MCP_ENDPOINT_PATH}`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        // The Streamable HTTP transport requires the client to accept both.
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new Error('no response')
  }
  if (!response.ok) throw new Error(String(response.status))
  const payload = parseBody(
    response.headers.get('content-type') ?? '',
    await response.text(),
  ) as { error?: { message?: string }; result?: T }
  if (payload.error) throw new Error(payload.error.message ?? 'error')
  return payload.result as T
}

interface ToolsListResult {
  tools?: Array<{
    name: string
    title?: string
    description?: string
    inputSchema?: {
      properties?: Record<string, JsonSchemaProperty>
      required?: Array<string>
    }
  }>
}

/** Read live so the page cannot go stale when the tools change. */
export async function fetchMcpTools(
  origin: string,
  signal?: AbortSignal,
): Promise<Array<McpTool>> {
  const list = await rpc<ToolsListResult>(origin, 'tools/list', {}, signal)
  return (list.tools ?? []).map((tool) => {
    const required = new Set(tool.inputSchema?.required ?? [])
    return {
      name: tool.name,
      title: tool.title,
      description: tool.description,
      parameters: Object.entries(tool.inputSchema?.properties ?? {}).map(
        ([name, prop]) => {
          const values = prop.enum ?? prop.items?.enum
          return {
            name,
            type: describeType(prop),
            required: required.has(name),
            description: prop.description,
            enumValues: values?.length ? values.map(String) : undefined,
          }
        },
      ),
    }
  })
}
