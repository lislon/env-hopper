import { describe, expect, it } from 'vitest'
import {
  resolveTemplate,
  substituteTemplate,
  substituteTemplateWithEnvParams,
} from '../defaultWithOverridesAndTemplate'

describe('DefaultWithOverridesAndTemplate', () => {
  describe('substituteTemplate', () => {
    it('should substitute template parameters correctly', () => {
      const template = 'https://{{subdomain}}.example.com/{{path}}'
      const params = { subdomain: 'dev', path: 'api' }

      const result = substituteTemplate(template, params)

      expect(result).toBe('https://dev.example.com/api')
    })

    it('should handle missing parameters gracefully', () => {
      const template = 'https://{{subdomain}}.example.com/{{path}}'
      const params = { subdomain: 'dev' }

      const result = substituteTemplate(template, params)

      expect(result).toBe('https://dev.example.com/{{path}}')
    })

    it('should handle empty parameters', () => {
      const template = 'https://example.com'
      const params = {}

      const result = substituteTemplate(template, params)

      expect(result).toBe('https://example.com')
    })

    it('should prefer the value over the default when the key is present', () => {
      const template = 'https://example.com/?q={{query ?? all}}'
      const params = { query: 'open' }

      const result = substituteTemplate(template, params)

      expect(result).toBe('https://example.com/?q=open')
    })

    it('should use the default when the key is missing', () => {
      const template = 'https://example.com/?q={{query ?? all}}'
      const params = {}

      const result = substituteTemplate(template, params)

      expect(result).toBe('https://example.com/?q=all')
    })

    it('should substitute an empty default when the key is missing', () => {
      const template = 'https://example.com/?q={{query ?? }}'
      const params = {}

      const result = substituteTemplate(template, params)

      expect(result).toBe('https://example.com/?q=')
    })

    it('should tolerate any whitespace around the default operator', () => {
      const template = '{{a??1}}|{{  b  ??  2  }}|{{c\t??\t3}}'
      const params = {}

      const result = substituteTemplate(template, params)

      expect(result).toBe('1|2|3')
    })

    // Still true, but the guarantee is narrower than it was: a substituted value
    // IS scanned for `{{...}}` now. What it is never scanned for is expression
    // syntax outside a placeholder, which is what this case covers.
    it('should not reinterpret a value that itself contains the operator', () => {
      const template = 'https://example.com/?q={{query}}&r={{missing ?? x}}'
      const params = { query: 'a ?? b' }

      const result = substituteTemplate(template, params)

      expect(result).toBe('https://example.com/?q=a ?? b&r=x')
    })

    it('should substitute values containing regex replacement patterns verbatim', () => {
      const template = 'https://example.com/{{path}}'
      const params = { path: '$&$1' }

      const result = substituteTemplate(template, params)

      expect(result).toBe('https://example.com/$&$1')
    })

    it('should treat the right side of the operator as a key when one exists', () => {
      const template = '{{env.meta.baseUrl ?? app.meta.baseUrl}}'
      const params = { 'app.meta.baseUrl': 'https://example.com' }

      const result = substituteTemplate(template, params)

      expect(result).toBe('https://example.com')
    })

    it('should fall through to the literal when no segment names a key', () => {
      const template = '{{env.meta.x ?? app.meta.x ?? https://example.com}}'

      const result = substituteTemplate(template, {})

      expect(result).toBe('https://example.com')
    })

    it('should take the first hit in a chain, left to right', () => {
      const template = '{{a ?? b ?? c ?? fallback}}'
      const params = { b: 'from-b', c: 'from-c' }

      const result = substituteTemplate(template, params)

      expect(result).toBe('from-b')
    })

    it('should resolve placeholders inside a substituted value', () => {
      const template = '{{app.meta.urlPattern}}'
      const params = {
        'app.meta.urlPattern': 'https://host-{{subdomain}}.{{domain}}',
        subdomain: 'dev',
        domain: 'example.com',
      }

      const result = substituteTemplate(template, params)

      expect(result).toBe('https://host-dev.example.com')
    })

    it('should follow the three-level alias chain a real page url needs', () => {
      // The chain that forced app-level patterns to be flattened server-side
      // while the cap was 2: a page url names an app alias, which names another
      // app pattern, which names env values.
      const template = '{{app.meta.baseUrl}}/app/home'
      const params = {
        'app.meta.baseUrl': '{{app.meta.stageUrl}}',
        'app.meta.stageUrl':
          'https://svc-{{env.meta.subdomain}}.{{env.meta.baseDomain}}',
        'env.meta.subdomain': 'dev-01',
        'env.meta.baseDomain': 'example.com',
      }

      const result = substituteTemplate(template, params)

      expect(result).toBe('https://svc-dev-01.example.com/app/home')
    })

    it('should stop after the pass cap rather than follow a longer chain', () => {
      const template = '{{one}}'
      const params = {
        one: '{{two}}',
        two: '{{three}}',
        three: '{{four}}',
        four: '{{five}}',
        five: '{{six}}',
        six: 'end',
      }

      const result = substituteTemplate(template, params)

      // MAX_TEMPLATE_PASSES is 5, counting nesting depth: the template plus four
      // levels of substituted value. The sixth is left raw so a caller can still
      // detect an unresolvable template.
      expect(result).toBe('{{six}}')
    })

    it('should terminate on a self-referential key', () => {
      const template = 'https://example.com/{{loop}}'
      const params = { loop: 'a{{loop}}' }

      const result = substituteTemplate(template, params)

      // One expansion per nesting level up to the cap, then the token is left
      // alone — the depth counter is what stops it, not a cycle check.
      expect(result).toBe('https://example.com/aaaaa{{loop}}')
    })

    it('should not scan a value listed as a literal key', () => {
      const template = 'https://example.com/?q={{typed}}'
      const params = { typed: '{{secret}}', secret: 'leaked' }

      const result = substituteTemplate(template, params, {
        literalKeys: new Set(['typed']),
      })

      expect(result).toBe('https://example.com/?q={{secret}}')
    })
  })

  describe('resolveTemplate', () => {
    it('should use default value when no override exists', () => {
      const data = {
        default: 'https://{{subdomain}}.example.com',
        templateParams: {
          dev: { subdomain: 'dev' },
        },
      }

      const result = resolveTemplate('dev', data, data.templateParams['dev'])

      expect(result).toBe('https://dev.example.com')
    })

    it('should use override when it exists', () => {
      const data = {
        default: 'https://{{subdomain}}.example.com',
        overrides: {
          prod: 'https://prod.example.com',
        },
        templateParams: {
          dev: { subdomain: 'dev' },
        },
      }

      const result = resolveTemplate('prod', data)

      expect(result).toBe('https://prod.example.com')
    })

    it('should apply template substitution to overrides', () => {
      const data = {
        default: 'https://{{subdomain}}.example.com',
        overrides: {
          prod: 'https://{{subdomain}}.company.com',
        },
        templateParams: {
          prod: { subdomain: 'app' },
        },
      }

      const result = resolveTemplate('prod', data, data.templateParams['prod'])

      expect(result).toBe('https://app.company.com')
    })

    it('should work without template parameters', () => {
      const data = {
        default: 'https://example.com',
      }

      const result = resolveTemplate('any', data)

      expect(result).toBe('https://example.com')
    })
  })

  describe('substituteTemplateWithEnvParams', () => {
    it('should merge env params with resource params and handle regex escaping', () => {
      const template = 'https://{{subdomain}}.example.com/{{path}}'
      const envParams = { subdomain: 'dev', region: 'us-east' }
      const resourceTemplateParams = {
        dev: { subdomain: 'custom-dev', path: 'api' },
      }
      const additionalParams = { path: 'override-path' }

      const result = substituteTemplateWithEnvParams(
        template,
        'dev',
        envParams,
        resourceTemplateParams,
        additionalParams,
      )

      // Should use: envParams -> resourceTemplateParams -> additionalParams
      // subdomain: 'dev' -> 'custom-dev' -> 'dev' (no override in additional)
      // path: undefined -> 'api' -> 'override-path'
      expect(result).toBe('https://custom-dev.example.com/override-path')
    })

    it('should apply defaults to a jump url template', () => {
      const template =
        'https://{{subdomain}}.example.com/pods?ns={{env.meta.k8sNs ?? --all-namespaces}}&q={{filter ?? }}'
      const envParams = { subdomain: 'dev' }

      const result = substituteTemplateWithEnvParams(template, 'dev', envParams)

      expect(result).toBe('https://dev.example.com/pods?ns=--all-namespaces&q=')
    })

    it('should let a late param value win over a default', () => {
      const template = 'https://example.com/?ns={{env.meta.k8sNs ?? all}}'
      const additionalParams = { 'env.meta.k8sNs': 'team-a' }

      const result = substituteTemplateWithEnvParams(
        template,
        'dev',
        undefined,
        undefined,
        additionalParams,
      )

      expect(result).toBe('https://example.com/?ns=team-a')
    })

    it('should handle regex special characters in parameter keys', () => {
      const template = 'https://{{subdomain}}.example.com/{{path.with.dots}}'
      const envParams = { subdomain: 'dev', 'path.with.dots': 'api' }

      const result = substituteTemplateWithEnvParams(template, 'dev', envParams)

      expect(result).toBe('https://dev.example.com/api')
    })

    it('should resolve an app-level pattern against env params', () => {
      const template = '{{app.meta.urlPattern}}/health'
      const envParams = { subdomain: 'dev', domain: 'example.com' }
      const appParams = {
        'app.meta.urlPattern': 'https://{{subdomain}}.{{domain}}',
      }

      const result = substituteTemplateWithEnvParams(
        template,
        'dev',
        envParams,
        undefined,
        undefined,
        appParams,
      )

      expect(result).toBe('https://dev.example.com/health')
    })

    it('should rank app params below every other source', () => {
      const template = '{{who}}'

      expect(
        substituteTemplateWithEnvParams(
          template,
          'dev',
          undefined,
          undefined,
          undefined,
          { who: 'app' },
        ),
      ).toBe('app')
      expect(
        substituteTemplateWithEnvParams(
          template,
          'dev',
          { who: 'env' },
          undefined,
          undefined,
          { who: 'app' },
        ),
      ).toBe('env')
      expect(
        substituteTemplateWithEnvParams(
          template,
          'dev',
          { who: 'env' },
          { dev: { who: 'jump' } },
          undefined,
          { who: 'app' },
        ),
      ).toBe('jump')
      expect(
        substituteTemplateWithEnvParams(
          template,
          'dev',
          { who: 'env' },
          { dev: { who: 'jump' } },
          { who: 'late' },
          { who: 'app' },
        ),
      ).toBe('late')
    })

    it('should never interpret a user-supplied value as template syntax', () => {
      const template = 'https://example.com/?q={{namespace}}'
      const envParams = { evil: 'pwned' }
      const userValues = { namespace: '{{evil}}' }

      const result = substituteTemplateWithEnvParams(
        template,
        'dev',
        envParams,
        undefined,
        userValues,
      )

      expect(result).toBe('https://example.com/?q={{evil}}')
    })
  })
})
