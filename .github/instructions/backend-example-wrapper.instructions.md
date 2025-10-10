---
applyTo: 'examples/backend-example/**'
---

# Backend Example - Configuration Wrapper

`examples/backend-example` is a **lightweight configuration/wrapper** for local development. It's NOT meant for production or complex business logic.

## Purpose

- **Minimal wrapper** around `@env-hopper/backend-core`
- Sets up environment variables and external services (auth providers, OpenAI, etc.)
- Demonstrates how to configure and mount the backend
- Provides a development server for testing

## What to Avoid

❌ **Don't add business logic here**
- No feature implementations
- No core algorithms
- No shared utilities

✅ **What belongs here**

- Environment variable configuration
- Service provider setup (auth, AI, etc.)
- Express app initialization
- Mounting backend-core modules

## Architecture Flow

```
examples/backend-example
  └── configures & mounts
       └── @env-hopper/backend-core
            ├── modules/auth
            ├── modules/admin
            ├── modules/icons
            └── server/
```

## Adding Features

If you need to add a feature:
1. **Check if it belongs in `packages/backend-core`** - it probably does
2. Add the module to `packages/backend-core/src/modules/`
3. Export it from `packages/backend-core/src/index.ts`
4. Import and configure it in `examples/backend-example`

## Example: Adding a New Feature

**Wrong (don't do this):**
```typescript
// examples/backend-example/src/index.ts
app.get('/api/my-feature', (req, res) => {
  // Business logic here ❌
})
```

**Right (do this):**
```typescript
// packages/backend-core/src/modules/myFeature/
export function createMyFeatureRouter(db: PrismaClient) { ... }

// examples/backend-example/src/index.ts
import { createMyFeatureRouter } from '@env-hopper/backend-core'
const myFeatureRouter = createMyFeatureRouter(db)
app.use(myFeatureRouter)
```

## Prisma Client Usage

❌ **CRITICAL: Never import Prisma client directly in `examples/backend-example`**

Prisma is **internal to `packages/backend-core` only**. The schema lives at `packages/backend-core/prisma/schema.prisma`.

**Wrong (don't do this):**
```typescript
// examples/backend-example/src/index.ts
import { PrismaClient } from '@prisma/client'  // ❌ FORBIDDEN
const db = new PrismaClient()
```

**Right (do this):**
```typescript
// Inject the PrismaClient from backend-core
import { getPrismaClient } from '@env-hopper/backend-core'
const db = getPrismaClient()
```

If backend-core doesn't export a way to access Prisma, add an export to `packages/backend-core/src/index.ts` instead of importing Prisma in this example.

## Environment Variables

Configuration lives in `.env`:
- Database URL
- Auth secrets and provider credentials
- External service keys (OpenAI, etc.)
- Server port and URLs

See `.env.example` for required variables.

