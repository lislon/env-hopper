---
applyTo: 'packages/frontend-core/src/routes/**'
---

# Route File Structure Guidelines

Routes in `packages/frontend-core/src/routes/` should be **minimal composition layers** - they only wire together components and providers, with no business logic.

## File Naming Conventions

**Correct:**
- `_layout/login.tsx` - nested route under `_layout`
- `_layout/apps.index.tsx` - index route for `/apps`
- `admin/icons.tsx` - nested under admin

**Incorrect:**
- `_layout.login.tsx` - uses dot instead of folder structure
- Route files with business logic inside

## Route Structure Patterns

### Standard _layout Route Pattern

Routes under `_layout/` should follow this structure:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MyPage } from '~/modules/myFeature/ui/MyPage'
import { MainLayout } from '~/ui/layout/MainLayout'
import { TopLevelProviders } from '~/ui/layout/TopLevelProviders'

export const Route = createFileRoute('/_layout/my-route')({
  component: RouteComponent,
})

function RouteComponent() {
  const { queryClient, trpcClient } = Route.useRouteContext()

  return (
    <TopLevelProviders queryClient={queryClient} trpcClient={trpcClient}>
      <MainLayout>
        <MyPage />
      </MainLayout>
    </TopLevelProviders>
  )
}
```

### Admin Route Pattern

Admin routes use `AdminLayout` with separate providers:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { MyAdminPage } from '~/modules/admin-base'

export const Route = createFileRoute('/admin/my-page')({
  component: MyAdminPage,
})
```

### Routes with Loaders

For routes that need data loading:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { routeLoader } from '~/modules/myFeature/routeLoader'
import { MyFeatureLayout } from '~/modules/myFeature/ui/layout/MyFeatureLayout'
import { MyPage } from '~/modules/myFeature/ui/pages/MyPage'

export const Route = createFileRoute('/_layout/my-route/')({
  component: RouteComponent,
  async loader(ctx) {
    return await routeLoader(ctx)
  },
})

function RouteComponent() {
  const loaderData = Route.useLoaderData()
  const { queryClient, trpcClient } = Route.useRouteContext()

  return (
    <MyFeatureLayout
      loaderData={loaderData}
      queryClient={queryClient}
      trpcClient={trpcClient}
    >
      <MyPage />
    </MyFeatureLayout>
  )
}
```

## Where to Put Logic

**In Routes (YES):**
- Import statements
- Route configuration (path, loader)
- Component composition
- Context access (`Route.useRouteContext()`, `Route.useLoaderData()`)

**In Routes (NO):**
- Business logic
- Event handlers
- State management
- Form handling
- API calls
- Complex UI components

**In Modules (YES):**
- All business logic
- Page components (`modules/*/ui/pages/`)
- Layout components (`modules/*/ui/layout/`)
- Utilities (`modules/*/utils/`)
- Context providers (`modules/*/context/`)
- API/tRPC hooks (`modules/*/api/`)

## Module Organization

When creating a new feature, organize under `modules/`:

```
modules/
  myFeature/
    ui/
      pages/
        MyPage.tsx         # Main page component
      layout/
        MyFeatureLayout.tsx # Feature-specific layout
      components/
        MyComponent.tsx     # Reusable components
    context/
      MyFeatureContext.tsx  # State management
    api/
      useMyQuery.ts        # tRPC/API hooks
    utils/
      myHelper.ts          # Helper functions
    index.ts               # Public exports
```

## Examples

See these files as reference:
- [packages/frontend-core/src/routes/_layout/apps.index.tsx](packages/frontend-core/src/routes/_layout/apps.index.tsx) - Standard pattern
- [packages/frontend-core/src/routes/_layout/login.tsx](packages/frontend-core/src/routes/_layout/login.tsx) - Auth route
- [packages/frontend-core/src/routes/admin/index.tsx](packages/frontend-core/src/routes/admin/index.tsx) - Admin route
- [packages/frontend-core/src/modules/auth/ui/LoginPage.tsx](packages/frontend-core/src/modules/auth/ui/LoginPage.tsx) - Page component with logic
