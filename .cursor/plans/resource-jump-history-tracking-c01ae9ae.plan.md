<!-- c01ae9ae-b9af-4a91-9e35-655b3e25199d da7f9718-fe99-4c95-a49c-d9007bebcf38 -->

# Implement Resource Jump History Tracking

## Overview

Implement a history tracking system for resource jumps that mirrors how environments are currently tracked. This will allow the app to remember and auto-select the last used resource jump when switching between environments.

## Current State Analysis

Environment tracking currently:

- Saves to `db.environmentHistory` table on selection change
- Stores `{ envSlug, timestamp }` items
- Loads history on mount
- History is queried but not used for auto-selection yet

## Implementation Tasks

### 1. Add Resource Jump History to Database Schema

**File**: `packages/frontend-core/src/userDb/EhDb.ts`

- Add `resourceJumpHistory!: Table<ResourceJumpHistoryItem>` property
- Add `ResourceJumpHistory = 'resourceJumpHistory'` to `dbCacheDbKeys` enum
- Update database version and add the new store to schema

### 2. Create Resource Jump History Types

**File**: Create `packages/frontend-core/src/modules/resourceJump/types.ts` (if types not in existing file)

- Add `ResourceJumpHistoryItem` interface with:
  - `resourceSlug: string`
  - `envSlug: string`
  - `timestamp: number`

Or add to existing types file if appropriate.

### 3. Track Resource Jump Selection in ResourceJumpContext

**File**: `packages/frontend-core/src/modules/resourceJump/ResourceJumpContext.tsx`

- Import `useDb` hook
- Import new history type
- Add state for history: `useState<Array<ResourceJumpHistoryItem>>([])`
- Load history on mount with `useEffect`
- Modify `setCurrentResourceJumpSlug` callback to:
  - Save to `db.resourceJumpHistory` when resource jump changes
  - Only save when both `currentEnvSlug` and `resourceSlug` are defined
  - Format: `{ resourceSlug, envSlug, timestamp }`
- Add `getHistory()` method to context interface

### 4. Implement Auto-Selection Logic

**File**: `packages/frontend-core/src/modules/resourceJump/ResourceJumpContext.tsx`

- Add logic in `useEffect` (around line 94-127) that:
  - When visiting `/env/$envSlug` without a resource jump in URL
  - Query history for last used resource jump for that environment
  - Auto-select it by calling `setCurrentResourceJumpSlug`
  - Only runs when `isLoadingResourceJumps` is false
  - Only runs when `resourceJumpLoader.resourceSlug` is undefined
  - Uses most recent `timestamp` as tiebreaker

### 5. Add History API Query Method

**File**: `packages/frontend-core/src/modules/resourceJump/ApiQueryMagazineResourceJump.ts`

- Add static method `getResourceJumpHistory({ db }: DbAware)` that returns query options
- Similar to how `ApiQueryMagazineHistory.getEnvSelectionHistory` works

### 6. Update Context Interface

**File**: `packages/frontend-core/src/modules/resourceJump/ResourceJumpContext.tsx`

- Add `getHistory: () => Array<ResourceJumpHistoryItem>` to `ResourceJumpContextIface`
- Expose it in the context value

## Key Implementation Details

### History Entry Format

```typescript
{
  resourceSlug: string,
  envSlug: string,
  timestamp: number
}
```

### Auto-Selection Logic Flow

1. User visits `/env/dev-01` (no resource jump)
2. Context loads and checks `resourceJumpLoader.resourceSlug`
3. If undefined, query `db.resourceJumpHistory` for entries where `envSlug === 'dev-01'`
4. Sort by timestamp descending
5. Take first result and call `setCurrentResourceJumpSlug(firstResult.resourceSlug)`
6. This triggers the existing navigation logic

### Independence Principle

- Switching environments does NOT change the selected resource jump
- Switching resource jumps does NOT change the selected environment
- Navigation logic in `ResourceJumpContext` already handles URL updates appropriately

## Testing Considerations

- Verify history saves when resource jump changes
- Verify auto-selection works when visiting environment without resource jump
- Verify independence: switching environments preserves resource jump selection
- Verify independence: switching resource jumps preserves environment selection
