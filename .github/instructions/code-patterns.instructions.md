---
applyTo: '**'
---

# Code Patterns & Abstraction Guidelines

## Type Safety

**Avoid using `any` type:**

- Always provide explicit types or use type inference
- If you must use a very permissive type, prefer `unknown` and add type guards
- For Prisma operations, use generated types or utility types like `Partial<T>`
- Use object spread with conditional properties instead of mutating typed objects

**Example:**

```typescript
// ❌ Bad - using any
const data: any = { ...rest }
if (condition) {
  data.field = value
}

// ✅ Good - using object spread with conditional properties
const data = {
  ...rest,
  ...(condition && { field: value }),
}

// ✅ Good - using unknown with type guards
const result: unknown = await fetchData()
if (isValidType(result)) {
  // result is now properly typed
}
```

## Type Reuse

**Prioritize backend type reuse over duplication:**

- Import types from `@env-hopper/backend-core` or `@env-hopper/shared-core` when available
- Avoid creating duplicate type definitions in frontend code
- For modifications with 1-2 fields, use TypeScript utility types:
  - `Pick<Type, Keys>` - select specific properties
  - `Omit<Type, Keys>` - exclude specific properties
  - `Exclude<UnionType, ExcludedMembers>` - filter union types
  - `Partial<Type>` - make all properties optional
  - `Required<Type>` - make all properties required

**Example:**

```typescript
// ❌ Bad - duplicating backend types
interface FrontendApp {
  id: string;
  name: string;
  url: string;
  iconId: string | null;
}

// ✅ Good - reusing backend types
import type { App } from '@env-hopper/backend-core';
type FrontendApp = App;

// ✅ Good - modifying with utilities
import type { App } from '@env-hopper/backend-core';
type AppFormData = Omit<App, 'id' | 'createdAt'>;
type AppPreview = Pick<App, 'id' | 'name' | 'iconId'>;
```

## Code Abstraction

**Proactively identify and suggest refactoring opportunities:**

- When you notice duplicated or repetitive code, suggest creating abstractions
- Common abstraction patterns:
  - **Components** - for repeated UI patterns
  - **Custom hooks** - for repeated stateful logic
  - **Utility functions** - for repeated transformations or calculations
  - **Constants/configs** - for repeated static values

**When to suggest abstractions:**

- Code block appears 3+ times
- Similar patterns with minor variations
- Complex logic that could be named and reused
- Repeated prop patterns across components

**Example patterns to watch for:**

- Dialog/modal implementations with similar structure
- Form field groups with similar validation
- Data fetching patterns with similar error handling
- List rendering with similar item structure
