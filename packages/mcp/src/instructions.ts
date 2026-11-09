import type { LateResolvableParam } from '@env-hopper/backend-core'

export interface InstructionSlots {
  params: Array<LateResolvableParam>
  /** One line each: `"user words" -> tool {args}`, in the deployment's own names. */
  examples?: Array<string>
  /** Anything else this deployment's agents should know, one line each. */
  notes?: Array<string>
}

/** `caseId (case, file), orderId, …`: each param with its aliases. */
export function paramList(params: Array<LateResolvableParam>): string {
  return params
    .map((p) =>
      p.aliases?.length ? `${p.slug} (${p.aliases.join(', ')})` : p.slug,
    )
    .join(', ')
}

/**
 * The server instructions: the one text a client always loads in full, so
 * every rule an agent needs to use the result is stated here, once.
 */
export function buildInstructions({
  params,
  examples = [],
  notes = [],
}: InstructionSlots): string {
  return [
    'Env Hopper (EH): UI URLs of apps on envs, staging + prod. Also staging logins (app UI) and DB credentials; prod gives access-request link instead.',
    'Jump = page inside app (case view, topic page). Jump may need param = object id user types.',
    `Params: ${paramList(params)}.`,
    "All name args fuzzy: pass user's words. Pass app/jump only when user's words name one; else env + params, server finds the jump. Unsure: list_apps(query) (matches app, jump and param names).",
    ...examples,
    'Never build URL yourself; hosts differ per env.',
    'Result echoes env/app/jump/params used. null = your words matched nothing (absent = not passed): ask user to pick from options[field] (options.params[key] for a param); never pick yourself. Non-null + options = close guess: use it, name the alternative.',
    "No env given: only ehUrl, user picks env there. missingParams: ask user for them; meanwhile give homeUrl (app's home page on that env). unusedParams: tell user they were ignored.",
    'url = page in app itself. ehUrl (get_url) = EH page for app+env: version, health, logins, other pages, switch env; opens same page; shareable. Reply: url first, ehUrl second line. ehUrl alone when user wants info, env switch, or url fails.',
    'User omits env: reuse last env from this chat, for any app, unless the link must not be tied to one env (wiki, team, sharing).',
    ...notes,
  ].join('\n')
}
