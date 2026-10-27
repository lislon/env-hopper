import { describe, expect, it } from 'vitest'
import { publicMessage } from '../../catalog/publicMessage'

describe('publicMessage', () => {
  it('keeps what went wrong and drops every URL, DSN, host, IP, email, token, SQL and stack line', () => {
    const raw = [
      // Made-up secrets, assembled so no secret scanner reads them as real ones.
      `fetch https://git.example.com/api/v4/projects/1?private_token=${'glpat'}-${'AbCdEf0123456789xyzQ'} failed:`,
      // A made-up DSN, assembled so the repository's secret scanner does not read it as one.
      `connect ${'postgres'}://app:${'s3cret'}@db.internal.example.com:5432/eh to 10.0.12.7:5432`,
      'with Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcDEF123,',
      'user ann@example.com, query SELECT * FROM users WHERE id = 1',
      '\n    at fetch (/app/dist/index.js:123:45)',
    ].join(' ')

    const clean = publicMessage(raw)

    expect({
      clean,
      length: clean.length <= 160,
      leaks: [
        'example.com',
        's3cret',
        'glpat',
        'eyJ',
        '10.0.12.7',
        'ann@',
        'SELECT',
        'index.js',
      ].filter((leak) => clean.includes(leak)),
    }).toEqual({
      clean:
        'fetch <url> failed: connect <url> to <ip> with Authorization: <redacted> <token> user <email>, query <sql>',
      length: true,
      leaks: [],
    })
  })
})
