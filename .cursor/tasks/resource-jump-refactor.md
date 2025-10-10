# Resource Jump Refactor Migration Guide

## Overview

The ResourceJumpsData structure has been refactored to use a collection-based design where each resource jump is self-contained with its own `urlTemplate` and optional `lateResolvableParams`, replacing the flat structure with shared templates.

## TypeScript Interface Changes

### Old Structure (Flat with Shared Templates)

```typescript
export interface ResourceJumpsData {
  basePerSlug: Array<ResourceJumpBaseInfo>
  basePerEnv: Array<EnvBaseInfo>
  urlTemplates: Record<JumpResourceSlug, DefaultWithOverridesAndTemplate>
  lateResolvableParams: Array<LateResolvableParam>
}

export interface ResourceJumpBaseInfo {
  slug: string
}
```

### New Structure (Collection-Based)

```typescript
export interface ResourceJump {
  slug: string
  displayName: string
  urlTemplate: DefaultWithOverridesAndTemplate
  lateResolvableParams?: Array<LateResolvableParam>
}

export interface ResourceJumpsData {
  resourceJumps: Array<ResourceJump>
  envs: Array<EnvBaseInfo>
}

export interface DefaultWithOverridesAndTemplate {
  default: string
  overrides?: Record<string, string>
  templateParams?: Record<string, Record<string, string>>
}

export interface LateResolvableParam {
  slug: string
  displayName: string
}
```

## Data Transformation Examples

### Before (Flat Structure)

```json
{
  "basePerSlug": [
    {
      "slug": "sales-crm"
    }
  ],
  "basePerEnv": [
    {
      "slug": "dev",
      "displayName": "Development"
    }
  ],
  "urlTemplates": {
    "sales-crm": {
      "default": "https://{{subdomain}}.dev.company.com/sales-dashboard",
      "templateParams": {
        "dev": { "subdomain": "dev" },
        "prod": { "subdomain": "company.com" }
      }
    }
  },
  "lateResolvableParams": [
    {
      "slug": "crmOrderId",
      "displayName": "CRM Order ID"
    }
  ]
}
```

### After (Collection-Based Structure)

```json
{
  "resourceJumps": [
    {
      "slug": "sales-crm",
      "displayName": "Sales CRM",
      "urlTemplate": {
        "default": "https://{{subdomain}}.dev.company.com/sales-dashboard",
        "templateParams": {
          "dev": { "subdomain": "dev" },
          "prod": { "subdomain": "company.com" }
        }
      },
      "lateResolvableParams": [
        {
          "slug": "crmOrderId",
          "displayName": "CRM Order ID"
        }
      ]
    }
  ],
  "envs": [
    {
      "slug": "dev",
      "displayName": "Development"
    }
  ]
}
```

## URL Resolution Algorithm

### Backend Resolution (Server-side)

```typescript
import { resolveTemplate } from '@env-hopper/shared-core'

function resolveUrl(resourceSlug: JumpResourceSlug, envSlug: EnvSlug, data: ResourceJumpsData): string {
  const resourceJump = data.resourceJumps.find((rj) => rj.slug === resourceSlug)
  if (!resourceJump) {
    throw new Error(`No resource jump found: ${resourceSlug}`)
  }

  const params = resourceJump.urlTemplate.templateParams?.[envSlug] || {}
  return resolveTemplate(envSlug, resourceJump.urlTemplate, params)
}
```

### Frontend Resolution (Client-side)

```typescript
import { resolveTemplate, substituteTemplate } from '@env-hopper/shared-core'

function resolveUrlWithLateParams(resourceSlug: JumpResourceSlug, envSlug: EnvSlug, lateParams: Record<string, string>, data: ResourceJumpsData): string {
  const resourceJump = data.resourceJumps.find((rj) => rj.slug === resourceSlug)
  if (!resourceJump) {
    throw new Error(`No resource jump found: ${resourceSlug}`)
  }

  // First resolve server-side template
  const params = resourceJump.urlTemplate.templateParams?.[envSlug] || {}
  const baseUrl = resolveTemplate(envSlug, resourceJump.urlTemplate, params)

  // Then resolve late-resolvable parameters
  return substituteTemplate(baseUrl, lateParams)
}

// Example usage:
const url = resolveUrlWithLateParams('sales-crm', 'dev', { crmOrderId: '12345' }, resourceJumpsData)
// Result: "https://dev.dev.company.com/sales-dashboard/orders/12345"
```

## Late-Resolvable Parameters

Late-resolvable parameters are placeholders in URLs that are resolved by the frontend at runtime:

### Template Syntax

- Format: `{{user:paramName}}`
- Examples: `{{user:crmOrderId}}`, `{{user:kafkaTopic}}`

### Available Parameters

- `crmOrderId`: CRM Order ID
- `kafkaTopic`: Kafka Topic

### Usage Example

```typescript
// URL template: "https://{{subdomain}}.company.com/orders/{{user:crmOrderId}}"
// Late params: { crmOrderId: "12345" }
// Result: "https://dev.company.com/orders/12345"
```

## Migration Checklist

### Backend Changes

- [x] Update ResourceJumpsData interface
- [x] Remove old parameter fields (paramsPerSlug, paramsPerEnv, paramsPerSlugPerEnv)
- [x] Add urlTemplates field with DefaultWithOverridesAndTemplate
- [x] Add lateResolvableParams array
- [x] Update filterSingleResourceJump function
- [x] Update example data structure

### Frontend Changes (TODO)

- [ ] Update URL resolution logic to use new structure
- [ ] Implement late-resolvable parameter substitution
- [ ] Update any code that accesses old parameter fields
- [ ] Test URL generation with new templates

### Data Migration

- [ ] Convert existing ResourceJumpsData to new format
- [ ] Update any hardcoded URL patterns
- [ ] Verify all URL templates resolve correctly

## Benefits

1. **Simplified Structure**: Single template per resource instead of complex parameter layers
2. **Better Performance**: Fewer nested lookups, more efficient resolution
3. **Cleaner API**: Easier to understand and maintain
4. **Late Resolution**: Support for runtime parameter substitution
5. **Type Safety**: Better TypeScript support with clearer interfaces
