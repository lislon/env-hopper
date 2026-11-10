import type { LateResolvableParam } from '@env-hopper/backend-core'

export type McpToolName =
  | 'get_url'
  | 'get_login'
  | 'get_database_access'
  | 'list_apps'
  | 'list_envs'

/** Lines per tool, appended to that tool's description. */
export type PerTool = Partial<Record<McpToolName, Array<string>>>

/** The deployment's own names for the server instructions, which say only WHEN to use the server. */
export interface WhenNames {
  /** Objects a page shows, e.g. `['a case', 'an order']`. */
  objects?: Array<string>
  /** Env names users type, e.g. `['dev', 'prod']`. */
  envs?: Array<string>
  /** A typical request with an object id, e.g. `crm order 1234`. */
  request?: string
}

export interface InstructionSlots {
  params: Array<LateResolvableParam>
  when?: WhenNames
  /** `"user words" -> {args}` lines, in the deployment's own names. */
  examples?: PerTool
  /** Anything else the deployment's agents get wrong, per tool. */
  notes?: PerTool
}

/** Claude Code's caps: instructions load every session, descriptions only on use. */
export const INSTRUCTIONS_MAX = 4096
export const DESCRIPTION_MAX = 16384

/** `caseId (case, file), orderId, …`: each param with its aliases. */
export function paramList(params: Array<LateResolvableParam>): string {
  return params
    .map((p) =>
      p.aliases?.length ? `${p.slug} (${p.aliases.join(', ')})` : p.slug,
    )
    .join(', ')
}

/** The server instructions: loaded into every session, so only WHEN to use the server. */
export function buildInstructions({
  when = {},
}: Pick<InstructionSlots, 'when'>): string {
  const {
    objects = ['a record', 'an order', 'a message topic'],
    envs = ['dev', 'staging', 'prod'],
    request = 'crm order 1234',
  } = when
  return (
    `Env Hopper: links to pages inside internal apps (${objects.join(', ')}) on any test or prod environment, ` +
    'test logins and database credentials for an app on an environment, and where an app is deployed, with version and health. ' +
    `Use it when the user names an internal app or an object id ("${request}"), with or without an environment (${envs.join(', ')}), ` +
    'or asks whether an app is down, or for its login, password, DB access or deployed version. ' +
    'It is the source for these: ask it before searching code or configs.'
  )
}

const ECHO =
  'Result echoes env/app/... used. null = words matched nothing (absent = not passed): ask user to pick from options[field]; never pick yourself. Non-null + options = close guess: use it, name the alternative.'
const ENV_REUSE = 'User omits env: reuse last env from this chat, for any app.'
const CREDS =
  'Prod (no shared credentials): "requestAccess" {url} instead; give that link, never hunt for a password elsewhere.'

/** The HOW, per tool: loaded only when the model picks the tool. */
export function buildToolDescriptions({
  params,
  examples = {},
  notes = {},
}: InstructionSlots): Record<McpToolName, string> {
  const say = (tool: McpToolName) =>
    examples[tool]?.length ? ['Examples:', ...examples[tool]] : []
  const lines = (tool: McpToolName, body: Array<string>) =>
    [...body, ...say(tool), ...(notes[tool] ?? [])].join('\n')

  return {
    get_url: [
      'Link to a page in an app. Jump = page inside app (case view, topic page); jump may need param = object id user types.',
      "Pass user's words; all names fuzzy. Pass app/jump only when user names one; else env + params, server finds the jump. Unsure: list_apps(query).",
      'An id word (case, order, topic, or one not listed below, like "cliniq 77") is a param, never a jump or app: pass it as the key the user said ({cliniq:"77"}); the server matches it.',
      'Never build URL yourself; hosts differ per env. Never edit the host of an earlier url: call again.',
      'Version, health, "is it down": list_envs {app, query:env}, not get_url + curl.',
      `params = {paramName: value}. Params (aliases): ${paramList(params)}.`,
      ...say('get_url'),
      'Result echoes env/app/jump/params used. null = words matched nothing (absent = not passed): ask user to pick from options[field] (options.params[key] for a param); never pick yourself. Non-null + options = close guess: use it, name the alternative.',
      "missingParams: ask user for them; meanwhile give homeUrl (app's home page on that env). unusedParams: tell user they were ignored.",
      'No env -> only ehUrl; user picks env there, do not ask for one.',
      'url = page in app itself. ehUrl = EH page for app+env: version, health, logins, other pages, switch env; opens same page; shareable. Reply: url first, ehUrl second line. ehUrl alone when user wants info, env switch, or url fails (404).',
      `${ENV_REUSE} Omit env when the link must not be tied to one env (wiki, team, sharing).`,
      ...(notes.get_url ?? []),
    ].join('\n'),
    get_login: lines('get_login', [
      'Shared UI logins for app on env: "logins" [{label, desc, username, password}]; [] = none, say so and offer get_url. List every login as given.',
      CREDS,
      ECHO,
      ENV_REUSE,
    ]),
    get_database_access: lines('get_database_access', [
      'DB connection for app on env: "databases" [{url (JDBC), host, port, database, username, password}]; [] = none.',
      'Writing a DB command for the user: password flag alone (mysql -p, psql -W) so it prompts; never put the password itself in a command, it lands in shell history.',
      CREDS,
      ECHO,
      ENV_REUSE,
    ]),
    list_apps: lines('list_apps', [
      'Apps with their jumps (and params each jump takes), and whether login/database exist. query matches app, jump and param names.',
      'Where deployed, version, health: list_envs {app}, not here.',
    ]),
    list_envs: lines('list_envs', [
      'Where an app is deployed, its version and health: pass {app} (+ query:env for one env). "is <app> down" -> {app, query:env}; read health, never curl the app.',
      "With app: only envs where it is deployed; deployedTracked:false = EH does not track this app's deployments (absent != not deployed). Without app: all envs with credentials kind.",
    ]),
  }
}
