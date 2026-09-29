import { describe, expect, it } from 'vitest'
import type { EhTemplateSelection } from '../ehTemplate'
import { buildEhTemplateParams, resolveEhTemplate } from '../ehTemplate'

const selection: EhTemplateSelection = {
  app: {
    slug: 'parts-catalog',
    displayName: 'Parts Catalog',
    meta: {
      repo: 'parts-catalog',
      dashboardId: null,
      links: { board: 'PARTS', wiki: null },
    },
  },
  env: {
    slug: 'staging',
    displayName: 'Staging',
    templateParams: { host: 'staging.example.com' },
    meta: { region: 'eu-west' },
  },
}

describe('buildEhTemplateParams', () => {
  it('exposes app, env and flattened meta, keeping env template params bare', () => {
    expect(buildEhTemplateParams(selection)).toEqual({
      host: 'staging.example.com',
      'app.slug': 'parts-catalog',
      'app.displayName': 'Parts Catalog',
      'app.meta.repo': 'parts-catalog',
      'app.meta.links.board': 'PARTS',
      'env.slug': 'staging',
      'env.displayName': 'Staging',
      'env.meta.region': 'eu-west',
    })
  })

  it('omits null meta values so a default can take over', () => {
    const params = buildEhTemplateParams(selection)

    expect(params).not.toHaveProperty('app.meta.dashboardId')
    expect(params).not.toHaveProperty('app.meta.links.wiki')
  })

  it('is empty when nothing is selected', () => {
    expect(buildEhTemplateParams({})).toEqual({})
  })
})

describe('resolveEhTemplate', () => {
  it('resolves app and env placeholders', () => {
    const result = resolveEhTemplate(
      'https://{{host}}/{{app.slug}}?env={{env.slug}}',
      selection,
    )

    expect(result).toBe('https://staging.example.com/parts-catalog?env=staging')
  })

  it('resolves nested meta placeholders', () => {
    const result = resolveEhTemplate(
      'Board {{app.meta.links.board}} in {{env.meta.region}}',
      selection,
    )

    expect(result).toBe('Board PARTS in eu-west')
  })

  it('applies a default for a missing key', () => {
    const result = resolveEhTemplate(
      'https://example.com/?filter={{app.meta.releaseFilter ?? all}}',
      selection,
    )

    expect(result).toBe('https://example.com/?filter=all')
  })

  it('applies an empty default for a missing key', () => {
    const result = resolveEhTemplate(
      'https://example.com/?filter={{app.meta.releaseFilter ?? }}',
      selection,
    )

    expect(result).toBe('https://example.com/?filter=')
  })

  it('treats a null meta value as missing', () => {
    const result = resolveEhTemplate(
      'https://example.com/d/{{app.meta.dashboardId ?? none}}',
      selection,
    )

    expect(result).toBe('https://example.com/d/none')
  })

  it('returns undefined when a placeholder cannot be resolved', () => {
    expect(
      resolveEhTemplate('https://{{host}}/{{app.meta.unknown}}', selection),
    ).toBeUndefined()
  })

  it('returns undefined when nothing is selected', () => {
    expect(
      resolveEhTemplate('https://{{host}}/{{app.slug}}', {}),
    ).toBeUndefined()
  })

  it('resolves a template with no placeholders', () => {
    expect(resolveEhTemplate('https://example.com', {})).toBe(
      'https://example.com',
    )
  })
})
