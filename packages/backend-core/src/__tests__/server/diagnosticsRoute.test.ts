// @vitest-environment node
/** `diagnostics` over real HTTP: there only where the deployment turns it on, and safe when it is. */
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTrpcRouter } from '../../server/controller'
import { createEhTrpcContext } from '../../server/ehTrpcContext'
import type { AddressInfo } from 'node:net'
import type {
  BootstrapConfigData,
  EhBackendCompanySpecificBackend,
} from '../../types'

let diagnostics = false
const backend = {
  getBootstrapData: async () =>
    ({ ui: { diagnostics } }) as unknown as BootstrapConfigData,
  getDiagnostics: async () => [
    {
      at: '2026-10-26T10:00:00.000Z',
      kind: 'check-failed',
      detail: `audit read of ${'https'}://audit.example.com/x failed`,
    },
  ],
} as Partial<EhBackendCompanySpecificBackend> as EhBackendCompanySpecificBackend

const server = createHTTPServer({
  router: createTrpcRouter(),
  createContext: () =>
    createEhTrpcContext({ companySpecificBackend: backend, adminGroups: [] }),
})
let url = ''
beforeAll(async () => {
  await new Promise<void>((r) => server.listen(0, r))
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => new Promise<void>((r) => server.close(() => r())))

const ask = async () => {
  const res = await fetch(`${url}/diagnostics`)
  return { status: res.status, body: (await res.json()) as unknown }
}

describe('diagnostics', () => {
  it('is 404 unless the bootstrap turns it on, and serves its events made safe when it does', async () => {
    diagnostics = false
    const off = await ask()
    diagnostics = true
    const on = await ask()

    expect({ off: off.status, on }).toEqual({
      off: 404,
      on: {
        status: 200,
        body: {
          result: {
            data: [
              {
                at: '2026-10-26T10:00:00.000Z',
                kind: 'check-failed',
                detail: 'audit read of <url> failed',
              },
            ],
          },
        },
      },
    })
  })
})
