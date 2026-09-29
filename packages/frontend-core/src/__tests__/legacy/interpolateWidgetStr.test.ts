import { describe, expect, it } from 'vitest'
import { interpolateWidgetStr } from '~/legacy/lib/utils'
import type { EhEnv } from '~/legacy/types'

/**
 * Parity fixture for the widget placeholder interpolator. Every case below is
 * the previous implementation's own spec case, values unchanged, including the
 * two that assert a placeholder is LEFT ALONE and the one that asserts an
 * infinite self-reference gives up rather than hanging.
 *
 * Added on top: the current payload's key shape. It keys an environment's
 * parameters by the whole placeholder name in `templateParams`, where the
 * previous payload used the bare key in `meta`. Both have to resolve, because a
 * deployment may serve either.
 */
describe('interpolateWidgetStr', () => {
  it('replaces placeholders from env and app', () => {
    const env: EhEnv = { id: '123', meta: { name: 'Alice' } }
    const app = { meta: { url: 'http://example.com' } }

    expect(
      interpolateWidgetStr(
        'Hello {{env.meta.name}}, your ID is {{env.id}} and link is {{app.meta.url}}.',
        env,
        app,
      ),
    ).toBe('Hello Alice, your ID is 123 and link is http://example.com.')
  })

  it('leaves an unresolved placeholder intact', () => {
    const env: EhEnv = { id: '123', meta: { name: 'Alice' } }
    const app = { meta: { url: 'http://example.com' } }

    expect(
      interpolateWidgetStr(
        'Hello {{env.meta.name}}, welcome to {{app.meta.unknownKey}}!',
        env,
        app,
      ),
    ).toBe('Hello Alice, welcome to {{app.meta.unknownKey}}!')
  })

  it('resolves a placeholder whose value is itself a placeholder', () => {
    const env: EhEnv = {
      id: '123',
      meta: { name: 'Alice', greeting: '{{app.meta.greeting}}' },
    }
    const app = { meta: { greeting: 'Welcome to the app' } }

    expect(
      interpolateWidgetStr(
        'Hello {{env.meta.name}}, {{env.meta.greeting}}!',
        env,
        app,
      ),
    ).toBe('Hello Alice, Welcome to the app!')
  })

  it('replaces every occurrence of the same placeholder', () => {
    const env: EhEnv = { id: '123', meta: { name: 'Alice' } }

    expect(
      interpolateWidgetStr(
        '{{env.meta.name}} is logged in. Hello {{env.meta.name}}!',
        env,
        undefined,
      ),
    ).toBe('Alice is logged in. Hello Alice!')
  })

  it('passes a string with no placeholders through', () => {
    const env: EhEnv = { id: '123', meta: { name: 'Alice' } }

    expect(interpolateWidgetStr('No placeholders here.', env, undefined)).toBe(
      'No placeholders here.',
    )
  })

  it('handles an empty string', () => {
    const env: EhEnv = { id: '123', meta: { name: 'Alice' } }

    expect(interpolateWidgetStr('', env, undefined)).toBe('')
  })

  it('leaves everything alone with no env and no app', () => {
    const str =
      'Hello {{env.meta.name}}, your ID is {{env.id}} and link is {{app.meta.url}}.'

    expect(interpolateWidgetStr(str, undefined, undefined)).toBe(str)
  })

  it('stops at the placeholder it cannot resolve, mid-recursion', () => {
    const env: EhEnv = {
      id: '123',
      meta: { greeting: 'Hello {{env.meta.name}}' },
    }

    expect(
      interpolateWidgetStr(
        'Welcome {{env.meta.greeting}}, have a great day!',
        env,
        undefined,
      ),
    ).toBe('Welcome Hello {{env.meta.name}}, have a great day!')
  })

  it('gives up on a self-referencing pair rather than looping forever', () => {
    const env: EhEnv = {
      id: '123',
      meta: { greeting: '{{env.meta.name}}', name: '{{env.meta.greeting}}' },
    }

    expect(
      interpolateWidgetStr(
        'Welcome {{env.meta.greeting}}, have a great day!',
        env,
        undefined,
      ),
    ).toBe('Welcome {{env.meta.greeting}}, have a great day!')
  })

  it('uses the ?? default only when the value is missing', () => {
    const env: EhEnv = { id: '123', meta: { name: 'Alice' } }

    expect(
      interpolateWidgetStr(
        'a={{env.meta.name ?? Kot}} b={{env.meta.name2 ?? Kot}}',
        env,
        undefined,
      ),
    ).toBe('a=Alice b=Kot')
  })

  it("resolves the current payload's fully qualified templateParams keys", () => {
    const env: EhEnv = {
      id: 'env-1',
      templateParams: { 'env.meta.k8sCtx': 'stage', 'env.meta.k8sNs': 'ns-1' },
    }

    expect(
      interpolateWidgetStr(
        'kubectl get pods --context {{env.meta.k8sCtx}} -n {{env.meta.k8sNs ?? --all-namespaces}}',
        env,
        undefined,
      ),
    ).toBe('kubectl get pods --context stage -n ns-1')
  })

  it('falls back to the ?? default when templateParams has no such key', () => {
    const env: EhEnv = {
      id: 'env-1',
      templateParams: { 'env.meta.k8sCtx': 'stage' },
    }

    expect(
      interpolateWidgetStr(
        '{{env.meta.k8sNs ?? --all-namespaces}}',
        env,
        undefined,
      ),
    ).toBe('--all-namespaces')
  })
})
