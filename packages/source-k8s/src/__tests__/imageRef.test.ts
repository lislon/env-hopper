import { describe, expect, it } from 'vitest'
import { parseImageRef } from '../imageRef'

describe('parseImageRef', () => {
  it('registry with port', () =>
    expect(parseImageRef('registry.example.com:5000/team/app:main-42')).toEqual(
      {
        registry: 'registry.example.com:5000',
        repository: 'team/app',
        tag: 'main-42',
      },
    ))
  it('no tag means latest', () =>
    expect(parseImageRef('team/app')).toEqual({
      registry: null,
      repository: 'team/app',
      tag: 'latest',
    }))
  it('digest pins keep the digest as tag', () =>
    expect(parseImageRef('r.example.com/app@sha256:abc')).toEqual({
      registry: 'r.example.com',
      repository: 'app',
      tag: 'sha256:abc',
    }))
})
