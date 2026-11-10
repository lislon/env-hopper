import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createMcpHandler } from '../createMcpHandler'
import {
  DESCRIPTION_MAX,
  INSTRUCTIONS_MAX,
  buildInstructions,
  buildToolDescriptions,
} from '../instructions'
import type { McpToolCallEvent } from '../toolCallEvent'
import { fixtureBackend, fixtureJumps } from './fixture'

const DEPLOYMENT_LIKE = {
  when: {
    objects: ['a case', 'an order', 'a message topic'],
    envs: ['qa-7', 'int-2', 'prod'],
    request: 'crm case 1234',
  },
  examples: {
    get_url: ['"case 1 on alpha" -> {env:"alpha", params:{caseId:"1"}}'],
    list_envs: ['"where is desk deployed" -> {app:"desk"}'],
  },
  notes: { get_login: ['Envs named *-sandbox are personal.'] },
}

describe('instructions: WHEN only', () => {
  it('the generic default names no deployment', () => {
    expect(buildInstructions({})).toBe(
      'Env Hopper: links to pages inside internal apps (a record, an order, a message topic) on any test or prod environment, test logins and database credentials for an app on an environment, and where an app is deployed, with version and health. Use it when the user names an internal app or an object id ("crm order 1234"), with or without an environment (dev, staging, prod), or asks whether an app is down, or for its login, password, DB access or deployed version. It is the source for these: ask it before searching code or configs.',
    )
  })

  it("a deployment's names fill the slots, well under the cap", () => {
    const text = buildInstructions(DEPLOYMENT_LIKE)
    expect(text).toBe(
      'Env Hopper: links to pages inside internal apps (a case, an order, a message topic) on any test or prod environment, test logins and database credentials for an app on an environment, and where an app is deployed, with version and health. Use it when the user names an internal app or an object id ("crm case 1234"), with or without an environment (qa-7, int-2, prod), or asks whether an app is down, or for its login, password, DB access or deployed version. It is the source for these: ask it before searching code or configs.',
    )
    expect(text.length).toBeLessThan(INSTRUCTIONS_MAX / 4)
  })
})

describe('tool descriptions: the HOW', () => {
  const d = buildToolDescriptions({
    params: fixtureJumps.lateResolvableParams,
    ...DEPLOYMENT_LIKE,
  })

  it('get_url: rules first, then params with aliases, examples, the result contract', () => {
    const lines = d.get_url.split('\n')
    expect(lines[1]).toMatch(/^Pass user's words/)
    expect(lines[2]).toMatch(/^An id word/)
    expect(lines[3]).toMatch(/^Never build URL yourself/)
    expect(lines[4]).toMatch(/^Version, health/)
    expect(lines[5]).toBe(
      'params = {paramName: value}. Params (aliases): caseId (case, dossier), orderId, clinicId.',
    )
    expect(lines.slice(6, 8)).toEqual([
      'Examples:',
      '"case 1 on alpha" -> {env:"alpha", params:{caseId:"1"}}',
    ])
    expect(d.get_url).toContain('never pick yourself')
    expect(d.get_url).toContain('missingParams')
    expect(d.get_url).toContain('No env -> only ehUrl')
  })

  it("a tool's examples and notes land on that tool only", () => {
    expect(d.list_envs).toMatch(/Examples:\n"where is desk deployed"/)
    expect(d.get_login.split('\n').at(-1)).toBe(
      'Envs named *-sandbox are personal.',
    )
    expect(d.get_database_access).not.toContain('sandbox')
    expect(d.get_database_access).toContain('mysql -p')
    expect(d.get_login).toContain('requestAccess')
  })

  it('each stays under the description cap, even with a long param list', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({
      slug: `param${i}Id`,
      displayName: `Param ${i}`,
      aliases: ['alias one', 'alias two'],
    }))
    const big = buildToolDescriptions({ params: many, ...DEPLOYMENT_LIKE })
    for (const text of Object.values(big))
      expect(text.length).toBeLessThan(DESCRIPTION_MAX)
  })
})

describe('createMcpHandler over HTTP', () => {
  const events: Array<McpToolCallEvent> = []
  const server = createServer((req, res) => {
    void createMcpHandler({
      backend: fixtureBackend,
      when: { envs: ['alpha'] },
      examples: { get_url: ['EXAMPLE'] },
      // A throwing hook must not break the call.
      onToolCall: (e) => {
        events.push(e)
        throw new Error('telemetry down')
      },
    })(req, res)
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
        'user-agent': 'test-agent/1',
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
    expect(init.result.instructions).toContain('environment (alpha)')

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

  it('tools/list gives each tool a one-line title for people, and the HOW to the model', async () => {
    const list = await rpc('tools/list', {})
    const tools = list.result.tools as Array<{
      name: string
      title: string
      description: string
    }>
    expect(tools.find((t) => t.name === 'get_url')!.description).toContain(
      'EXAMPLE',
    )
    expect(Object.fromEntries(tools.map((t) => [t.name, t.title]))).toEqual({
      get_url: 'Link to a page in an app, for an env or env-less',
      get_login: 'Test logins for an app on an env',
      get_database_access: 'DB connection for an app on an env',
      list_apps: 'Apps, their pages and the ids each page takes',
      list_envs: 'Envs, and where an app is deployed with version',
    })
  })

  it('onToolCall: what was sent, what resolved, counts', async () => {
    events.length = 0
    await rpc('tools/call', {
      name: 'get_url',
      arguments: {
        env: 'alpha',
        params: { caseId: '9', cliniq: '3' },
      },
    })
    const e = events[0]!
    expect({ ...e, durationMs: 0 }).toEqual({
      tool: 'get_url',
      client: 'test-agent/1',
      durationMs: 0,
      args: {
        env: 'alpha',
        params: { caseId: '9', cliniq: '3' },
      },
      resolved: {
        env: 'alpha-integration-01',
        jump: 'orders@case-view',
        params: ['caseId'],
      },
      outcome: {
        url: false,
        ehUrl: false,
        nulls: ['params.cliniq'],
        guessed: ['env'],
        options: { env: 1, 'params.cliniq': expect.any(Number) },
        missingParams: [],
        unusedParams: [],
      },
    })
  })

  it('onToolCall on list_envs: the count, and an app that matched nothing', async () => {
    events.length = 0
    await rpc('tools/call', { name: 'list_envs', arguments: {} })
    await rpc('tools/call', { name: 'list_envs', arguments: { app: 'zzzz' } })
    expect(events.map((e) => e.outcome)).toEqual([
      { envs: 3 },
      { nulls: ['app'], guessed: [], options: expect.any(Object) },
    ])
  })

  it('onToolCall never carries credential content, only counts', async () => {
    events.length = 0
    for (const env of ['alpha-integration-01', 'production'])
      for (const name of ['get_login', 'get_database_access'])
        await rpc('tools/call', { name, arguments: { app: 'orders', env } })
    expect(events.map((e) => [e.tool, e.outcome])).toEqual([
      [
        'get_login',
        {
          logins: 2,
          requestAccess: false,
          nulls: [],
          guessed: [],
          options: {},
        },
      ],
      [
        'get_database_access',
        {
          databases: 1,
          requestAccess: false,
          nulls: [],
          guessed: [],
          options: {},
        },
      ],
      [
        'get_login',
        { requestAccess: true, nulls: [], guessed: [], options: {} },
      ],
      [
        'get_database_access',
        expect.objectContaining({ requestAccess: expect.any(Boolean) }),
      ],
    ])
    const text = JSON.stringify(events)
    for (const secret of [
      'pw1',
      'pw2',
      'secret',
      'viewer@',
      'jdbc:',
      'orders-db',
      '"admin"',
      'access.example',
    ])
      expect(text).not.toContain(secret)
  })
})
