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

    it('should handle regex special characters in parameter keys', () => {
      const template = 'https://{{subdomain}}.example.com/{{path.with.dots}}'
      const envParams = { subdomain: 'dev', 'path.with.dots': 'api' }

      const result = substituteTemplateWithEnvParams(template, 'dev', envParams)

      expect(result).toBe('https://dev.example.com/api')
    })
  })
})
