import { describe, expect, it } from 'vitest'
import { ehFormatUrl } from '../ehFormatUrl.js'

describe('ehFormatUrl', () => {
  it('generates the correct URL from nested templates', () => {
    const actual = ehFormatUrl(
      '<%= it.appMeta.baseUrl + "/prod-lims/app/home" %>',
      {
        appMeta: {
          baseUrl:
            '<%= it.envMeta.isProduction ? "https://production.example.com" : "https://" + it.envMeta.subdomain + ".example.com:8250" %>',
        },
        envMeta: {
          isProduction: false,
          subdomain: 'staging',
        },
      },
    )

    expect(actual).toStrictEqual(
      'https://staging.example.com:8250/prod-lims/app/home',
    )
  })
})
