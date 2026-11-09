import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createMcpHandler } from '../createMcpHandler'
import { buildInstructions } from '../instructions'
import { fixtureBackend, fixtureJumps } from './fixture'

describe('instructions', () => {
  it('fills the param list, examples and notes into the template', () => {
    expect(
      buildInstructions({
        params: fixtureJumps.lateResolvableParams,
        examples: [
          '"case 1 on alpha" -> get_url {env:"alpha", params:{caseId:"1"}}',
        ],
        notes: ['Envs named *-sandbox are personal.'],
      }).split('\n'),
    ).toEqual([
      'Env Hopper (EH): UI URLs of apps on envs, staging + prod. Also staging logins (app UI) and DB credentials; prod gives access-request link instead.',
      'Jump = page inside app (case view, topic page). Jump may need param = object id user types.',
      'Params: caseId (case, dossier), orderId, clinicId.',
      "All name args fuzzy: pass user's words. Pass app/jump only when user's words name one; else env + params, server finds the jump. Unsure: list_apps(query) (matches app, jump and param names).",
      '"case 1 on alpha" -> get_url {env:"alpha", params:{caseId:"1"}}',
      'Never build URL yourself; hosts differ per env.',
      'Result echoes env/app/jump/params used. null = your words matched nothing (absent = not passed): ask user to pick from options[field] (options.params[key] for a param); never pick yourself. Non-null + options = close guess: use it, name the alternative.',
      "No env given: only ehUrl, user picks env there. missingParams: ask user for them; meanwhile give homeUrl (app's home page on that env). unusedParams: tell user they were ignored.",
      'url = page in app itself. ehUrl (get_url) = EH page for app+env: version, health, logins, other pages, switch env; opens same page; shareable. Reply: url first, ehUrl second line. ehUrl alone when user wants info, env switch, or url fails.',
      'User omits env: reuse last env from this chat, for any app, unless the link must not be tied to one env (wiki, team, sharing).',
      'Envs named *-sandbox are personal.',
    ])
  })
})

describe('createMcpHandler over HTTP', () => {
  const server = createServer((req, res) => {
    void createMcpHandler({ backend: fixtureBackend, examples: ['EXAMPLE'] })(
      req,
      res,
    )
  })
  let base = ''
  beforeAll(async () => {
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  afterAll(() => new Promise<void>((r) => server.close(() => r())))

  async function rpc(method: string, params: unknown) {
    const res = await fetch(`${base}/api/mcp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'eh.example.test',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    })
    const text = await res.text()
    // Either a JSON body or one SSE `data:` event.
    const json = text.startsWith('{')
      ? text
      : text
          .split('\n')
          .find((l) => l.startsWith('data:'))!
          .slice(5)
    return JSON.parse(json) as { result: Record<string, unknown> }
  }

  it('initialize carries the instructions; a tool call answers with ehUrl on the public origin', async () => {
    const init = await rpc('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '0' },
    })
    expect(String(init.result.instructions).split('\n')[4]).toBe('EXAMPLE')

    const call = await rpc('tools/call', {
      name: 'get_url',
      arguments: { app: 'desk', params: { caseId: '9' } },
    })
    expect(call.result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ehUrl: 'https://eh.example.test/app/orders@case-view/sub/9',
            app: 'orders',
            jump: 'orders@case-view',
            params: { caseId: '9' },
          }),
        },
      ],
    })
  })

  it('tools/list gives each tool a one-line title for people', async () => {
    const list = await rpc('tools/list', {})
    const tools = list.result.tools as Array<{ name: string; title: string }>
    expect(Object.fromEntries(tools.map((t) => [t.name, t.title]))).toEqual({
      get_url: 'Link to a page in an app, for an env or env-less',
      get_login: 'Test logins for an app on an env',
      get_database_access: 'DB connection for an app on an env',
      list_apps: 'Apps, their pages and the ids each page takes',
      list_envs: 'Envs, and where an app is deployed with version',
    })
  })
})
