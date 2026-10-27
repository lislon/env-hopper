import { describe, expect, it } from 'vitest'
import { errorText } from '~/util/error-utils'

describe('errorText', () => {
  it('says the backend is restarting for a 5xx or an HTML answer, and keeps any other message', () => {
    const withStatus = (status: number) =>
      Object.assign(new Error('Bad Gateway'), {
        meta: { response: { status } },
      })

    expect(
      [
        new SyntaxError(`Unexpected token '<', "<html>"... is not valid JSON`),
        withStatus(503),
        withStatus(502),
        withStatus(404),
        new Error('catalog down'),
      ].map(errorText),
    ).toEqual([
      'env-hopper is restarting · retrying',
      'env-hopper is restarting · retrying',
      'env-hopper is restarting · retrying',
      'Bad Gateway',
      'catalog down',
    ])
  })
})
