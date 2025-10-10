<!-- 8f04ad5e-810e-4665-a19b-de3a6c8a19ec 6bb92f0c-a65e-4224-b857-2a041a64fbaf -->
# Restructure Resource Jumps Data

## Overview

Refactor ResourceJumpsData from a flat structure with shared urlTemplates and lateResolvableParams to a collection-based design where each resource jump is self-contained with its own urlTemplate and lateResolvableParams.

## Proposed New Structure

### Current Structure (Flat)

```typescript
export interface ResourceJumpsData {
  basePerSlug: Array<ResourceJumpBaseInfo>
  basePerEnv: Array<EnvBaseInfo>
  urlTemplates: Record<JumpResourceSlug, DefaultWithOverridesAndTemplate>
  lateResolvableParams: Array<LateResolvableParam>
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
```

## Changes

### 1. Update Type Definitions

**File**: `packages/backend-core/src/types/common/dataRootTypes.ts`

- Create new `ResourceJump` interface with `slug`, `urlTemplate`, and optional `lateResolvableParams`
- Rename `basePerSlug` → `resourceJumps` (Array of ResourceJump)
- Rename `basePerEnv` → `envs`
- Remove top-level `urlTemplates` and `lateResolvableParams`
- Remove `ResourceJumpBaseInfo` (replaced by ResourceJump)

### 2. Update Example Data

**File**: `examples/backend-example/src/example-data.ts`

Convert from:

```typescript
{
  basePerSlug: [{ slug: 'car-shop-sales-cars' }],
  urlTemplates: {
    'car-shop-sales-cars': { default: '...', templateParams: {...} }
  },
  lateResolvableParams: [...]
}
```

To:

```typescript
{
  resourceJumps: [
    {
      slug: 'car-shop-sales-cars',
      urlTemplate: { default: '...', templateParams: {...} },
      lateResolvableParams: [{ slug: 'crmOrderId', displayName: 'CRM Order ID' }]
    }
  ],
  envs: [...]
}
```

### 3. Update Controller

**File**: `packages/backend-core/src/server/controller.ts`

Update `filterSingleResourceJump` to:

- Find resource jump by slug from `resourceJumps` array
- Filter envs array
- Return filtered ResourceJumpsData with single resource jump

### 4. Update Tests

**File**: `examples/backend-example/src/__tests__/resource-jumps.test.ts`

Update snapshot to match new structure

### 5. Update Legacy Mapper

**File**: `examples/backend-example/src/local/example-data.local.ts`

Update to generate new structure with resourceJumps array

### 6. Update Documentation

**File**: `.cursor/tasks/resource-jump-refactor.md`

Update migration guide with new collection-based structure

### To-dos

- [ ] Create DefaultWithOverridesAndTemplate interface in shared-core
- [ ] Update ResourceJumpsData types in backend-core
- [ ] Convert example-data.ts to new structure
- [ ] Update filterSingleResourceJump function
- [ ] Update test snapshots
- [ ] Create migration documentation