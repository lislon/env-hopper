# Better Auth Integration Guide

This guide explains how the authentication system works in EnvHopper with Better Auth.

## Architecture Overview

Authentication is split across three layers:

### 1. **Backend Core** (`packages/backend-core`)
- Core authentication module in `src/modules/auth/`
- Implements Better Auth with pluggable OAuth providers
- Provides Express middleware registration
- Exports: `createAuth()`, `registerAuthRoutes()`, `createAuthRouter()`
- Uses Express **v5** with `toNodeHandler` from `better-auth/node` for proper request handling.

### 2. **Backend Example** (`examples/backend-example`)
- Configures OAuth providers via environment variables
- Located in `src/config/authProviders.ts`
- Handles provider-specific setup (GitHub, Google, Okta, etc.)
- **Only this package should contain provider configuration**

### 3. **Frontend Core** (`packages/frontend-core`)
- React hooks and context in `src/modules/auth/`
- `AuthProvider` component wraps the entire app
- Hooks: `useAuth()`, `useIsAuthenticated()`, `useUser()`
- `ProtectedContent` component guards sensitive UI
- Integrates with header - Admin menu only shows for authenticated users

## Setup Instructions

### 1. Database Schema
Better Auth models are automatically included in both `backend-core` and `backend-example` Prisma schemas:
- `user` - User accounts
- `session` - User sessions
- `account` - OAuth account links
- `verification` - Email verification tokens

Generate Prisma clients:
```bash
pnpm prisma:generate
```

### 2. Environment Configuration
Set up `.env` in `examples/backend-example/`:

```env
# Required
BETTER_AUTH_SECRET=<generated-secret-min-32-chars>
BETTER_AUTH_URL=http://localhost:4001

# Optional OAuth providers
AUTH_GITHUB_CLIENT_ID=xxx
AUTH_GITHUB_CLIENT_SECRET=xxx

AUTH_GOOGLE_CLIENT_ID=xxx
AUTH_GOOGLE_CLIENT_SECRET=xxx

AUTH_OKTA_CLIENT_ID=xxx
AUTH_OKTA_CLIENT_SECRET=xxx
AUTH_OKTA_ISSUER=https://your-org.okta.com
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 3. Database Migration
```bash
pnpm prisma db push --force-reset
```

### 4. Start the Backend
```bash
cd examples/backend-example
pnpm run dev
```

Auth endpoints are available at:
- `POST /api/auth/sign-in/email` - Email/password login
- `POST /api/auth/sign-up/email` - Email/password signup
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signin/{provider}` - OAuth login (github, google, etc.)
- `GET /api/auth/callback/{provider}` - OAuth callback

## Frontend Integration

### 1. Wrap App with AuthProvider
The app is already wrapped in `TopLevelProviders`:

```tsx
import { AuthProvider } from '~/modules/auth'

export function TopLevelProviders({ children }) {
  return (
    <AuthProvider>
      {/* rest of providers */}
    </AuthProvider>
  )
}
```

### 2. Use Auth Hooks
```tsx
import { useAuth, useIsAuthenticated, useUser } from '~/modules/auth'

function MyComponent() {
  const { isAuthenticated, isLoading } = useAuth()
  const user = useUser()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Not authenticated</div>
  
  return <div>Welcome {user?.name}</div>
}
```

### 3. Protect UI Elements
```tsx
import { ProtectedContent } from '~/modules/auth'

export function Header() {
  return (
    <>
      {/* Public content */}
      <ProtectedContent>
        {/* Only shown to authenticated users */}
        <Link to="/admin">Admin</Link>
      </ProtectedContent>
    </>
  )
}
```

### 4. Authentication Actions
```tsx
import { useAuthActions } from '~/modules/auth'

function LoginForm() {
  const { login, signup, logout, socialLogin } = useAuthActions()
  
  return (
    <>
      <button onClick={() => login({ email: '...', password: '...' })}>
        Login
      </button>
      <button onClick={() => socialLogin('github')}>
        Login with GitHub
      </button>
      <button onClick={logout}>Logout</button>
    </>
  )
}
```

## Adding New OAuth Providers

### 1. Get OAuth Credentials
Obtain client ID and secret from your provider (GitHub, Google, Okta, etc.)

**For Okta specifically:**
See [okta-setup.md](./okta-setup.md) for detailed Okta OIDC configuration and how to allow all users in your Okta organization.

### 2. Add to Configuration
In `examples/backend-example/src/config/authProviders.ts`:

```typescript
export function getAuthProviders(): BetterAuthOptions['socialProviders'] {
  const providers = {}
  
  // Add your provider
  if (process.env.AUTH_PROVIDER_CLIENT_ID && process.env.AUTH_PROVIDER_CLIENT_SECRET) {
    providers.provider = {
      clientId: process.env.AUTH_PROVIDER_CLIENT_ID,
      clientSecret: process.env.AUTH_PROVIDER_CLIENT_SECRET,
    }
  }
  
  return providers
}
```

### 3. Set Environment Variables
Add to `.env`:
```env
AUTH_PROVIDER_CLIENT_ID=xxx
AUTH_PROVIDER_CLIENT_SECRET=xxx
```

### 4. Update Prisma Schema
If the provider requires new fields, update the `user` or `account` models in schema.prisma

See [better-auth.com/docs](https://better-auth.com/docs) for provider-specific configuration.

## Admin Menu Protection

The Admin menu in the header is automatically hidden for unauthenticated users:

```tsx
// packages/frontend-core/src/ui/components/header/Header.tsx
export function Header() {
  const isAuthenticated = useIsAuthenticated()
  
  return (
    <>
      {isAuthenticated && <HeaderNavLink to="/admin" label="Admin" />}
    </>
  )
}
```

To require authentication for the admin route, also protect it in the route definition:

```tsx
// packages/frontend-core/src/routes/admin.tsx
import { ProtectedContent } from '~/modules/auth'

export const Route = createFileRoute('/admin')({
  component: () => (
    <ProtectedContent fallback={<NotAuthorizedPage />}>
      <AdminLayout />
    </ProtectedContent>
  ),
})
```

## Key Files

**Backend:**
- `packages/backend-core/src/modules/auth/` - Core auth module
- `examples/backend-example/src/config/authProviders.ts` - Provider config
- `packages/backend-core/prisma/schema.prisma` - Auth models

**Frontend:**
- `packages/frontend-core/src/modules/auth/` - Auth context and hooks
- `packages/frontend-core/src/ui/components/header/Header.tsx` - Protected header
- `packages/frontend-core/src/ui/layout/TopLevelProviders.tsx` - Auth provider setup

## Security Considerations

1. **Secret Management**: Keep `BETTER_AUTH_SECRET` secret and rotate it periodically
2. **HTTPS**: In production, set `useSecureCookies: true` in auth config
3. **CORS**: Configure trusted origins for OAuth callbacks
4. **Session Expiry**: Configure session timeout via `session.expiresIn`
5. **Database**: Keep auth tables in a secure database with proper backups

## Troubleshooting

**Session not persisting:**
- Check `BETTER_AUTH_SECRET` is set correctly
- Ensure database migrations have been applied
- Verify cookies are being sent with `credentials: 'include'`

**OAuth provider not working:**
- Confirm client ID/secret are correct
- Check redirect URI matches provider configuration
- Verify `BETTER_AUTH_URL` matches your app URL

**Admin menu not appearing:**
- Check `AuthProvider` is wrapping the app
- Verify session endpoint returns user data
- Check browser console for auth fetch errors

## References

- [Better Auth Docs](https://better-auth.com/docs)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [OAuth 2.0 Security](https://oauth.net/2/)
