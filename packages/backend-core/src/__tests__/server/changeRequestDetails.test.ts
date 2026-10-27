// @vitest-environment node
/** `changeRequestDetails`: what the deployment says about a change request, trimmed. */
import { describe, expect, it } from 'vitest'
import { createTrpcRouter } from '../../server/controller'
import { createEhTrpcContext } from '../../server/ehTrpcContext'
import type { EhBackendCompanySpecificBackend } from '../../types'

/** The query, answered by the deployment with `answer`. */
function given(
  answer?: EhBackendCompanySpecificBackend['getChangeRequestDetails'],
) {
  return createTrpcRouter().createCaller(
    createEhTrpcContext({
      companySpecificBackend: {
        ...(answer && { getChangeRequestDetails: answer }),
      } as EhBackendCompanySpecificBackend,
      adminGroups: [],
    }),
  )
}

describe('changeRequestDetails', () => {
  it("sends the description's first 2 KB, marked where it was cut", async () => {
    const asked: Array<unknown> = []
    const api = given((input) => {
      asked.push(input)
      return Promise.resolve({ description: 'x'.repeat(3000) })
    })

    const details = await api.changeRequestDetails({
      appSlug: 'shop',
      componentSlug: 'shop-api',
      id: '14',
    })

    expect({ asked, details }).toEqual({
      asked: [{ appSlug: 'shop', componentSlug: 'shop-api', id: '14' }],
      details: { description: `${'x'.repeat(2048)}…` },
    })
  })

  it('a short description goes as it is', async () => {
    const api = given(() => Promise.resolve({ description: '## Why\nfix' }))

    expect(
      await api.changeRequestDetails({
        appSlug: 'shop',
        componentSlug: 'shop-api',
        id: '14',
      }),
    ).toEqual({ description: '## Why\nfix' })
  })

  it('a deployment that keeps no change requests, or does not know this one, sends an empty description', async () => {
    const input = { appSlug: 'shop', componentSlug: 'shop-api', id: '14' }

    expect({
      none: await given().changeRequestDetails(input),
      unknown: await given(() => Promise.resolve(null)).changeRequestDetails(
        input,
      ),
    }).toEqual({ none: { description: '' }, unknown: { description: '' } })
  })

  it('refuses an id that is not a number', async () => {
    const api = given(() => Promise.resolve({ description: 'x' }))

    await expect(
      api.changeRequestDetails({
        appSlug: 'shop',
        componentSlug: 'shop-api',
        id: '../14',
      }),
    ).rejects.toThrow()
  })
})
