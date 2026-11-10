import type { McpToolName } from './instructions'
import type { McpResult } from './tools'

/**
 * One tool call, for telemetry. Holds what the model sent and how it resolved,
 * never what a credential tool answered: logins and databases are counts only.
 */
export interface McpToolCallEvent {
  tool: McpToolName
  /** The request's User-Agent. */
  client: string | null
  durationMs: number
  /** Exactly what the model sent. */
  args: Record<string, unknown>
  /** The slugs used; `params` = the param names that resolved. */
  resolved: {
    env?: string
    app?: string
    jump?: string
    params?: Array<string>
  }
  outcome: Record<string, unknown>
}

type ListResult = {
  envs?: Array<unknown>
  apps?: Array<unknown>
  deployedTracked?: boolean
}

/** null / guessed / options per field; a param shows as `params.<key>`. */
function matching(r: McpResult) {
  const nulls: Array<string> = []
  const guessed: Array<string> = []
  const options: Record<string, number> = {}
  for (const f of ['env', 'app', 'jump'] as const) {
    const n = r.options?.[f]?.length
    if (n) options[f] = n
    if (r[f] === null) nulls.push(f)
    else if (r[f] && n) guessed.push(f)
  }
  for (const [key, value] of Object.entries(r.params ?? {})) {
    const n = r.options?.params?.[key]?.length
    if (n) options[`params.${key}`] = n
    if (value === null) nulls.push(`params.${key}`)
    else if (n) guessed.push(`params.${key}`)
  }
  return { nulls, guessed, options }
}

export function toolCallEvent(
  tool: McpToolName,
  args: Record<string, unknown>,
  result: McpResult & ListResult,
  meta: { client: string | null; durationMs: number },
): McpToolCallEvent {
  const resolved: McpToolCallEvent['resolved'] = {}
  if (result.env) resolved.env = result.env
  if (result.app) resolved.app = result.app
  if (result.jump) resolved.jump = result.jump
  if (result.params) {
    resolved.params = Object.keys(result.params).filter(
      (k) => result.params![k] !== null,
    )
  }

  let outcome: Record<string, unknown>
  if (tool === 'get_url') {
    outcome = {
      url: Boolean(result.url),
      ehUrl: Boolean(result.ehUrl),
      ...matching(result),
      missingParams: result.missingParams ?? [],
      unusedParams: result.unusedParams ?? [],
    }
  } else if (tool === 'get_login' || tool === 'get_database_access') {
    const list = tool === 'get_login' ? 'logins' : 'databases'
    outcome = {
      ...(result[list] ? { [list]: result[list].length } : {}),
      requestAccess: Boolean(result.requestAccess),
      ...matching(result),
    }
  } else {
    const list = tool === 'list_apps' ? 'apps' : 'envs'
    outcome = {
      ...(result[list] ? { [list]: result[list].length } : {}),
      ...(result.deployedTracked !== undefined
        ? { deployedTracked: result.deployedTracked }
        : {}),
      // list_envs {app}: an app that matched nothing or was a close guess.
      ...(args.app !== undefined ? matching(result) : {}),
    }
  }

  return { tool, ...meta, args, resolved, outcome }
}
