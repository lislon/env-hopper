# Backend Example Auth Setup

## GitHub OAuth (recommended)
1. Create GitHub OAuth App: Settings → Developer settings → OAuth Apps → New.
2. Set callback URL: `http://localhost:4001/api/auth/callback/github` (prod: `https://your-domain.com/api/auth/callback/github`).
3. Add to `.env`:
```
AUTH_GITHUB_CLIENT_ID=...
AUTH_GITHUB_CLIENT_SECRET=...
BETTER_AUTH_URL=http://localhost:4001
BETTER_AUTH_SECRET=<32+ char random>
```
4. Restart backend.

## Okta OIDC (optional)
1. Okta Admin → Applications → Create App (OIDC, Web).
2. Callback URL: `http://localhost:4001/api/auth/callback/okta` (prod: `https://your-domain.com/api/auth/callback/okta`).
3. Add to `.env`:
```
AUTH_OKTA_CLIENT_ID=...
AUTH_OKTA_CLIENT_SECRET=...
AUTH_OKTA_ISSUER=https://your-org.okta.com
BETTER_AUTH_URL=http://localhost:4001
BETTER_AUTH_SECRET=<32+ char random>
```
4. Assign users/groups to the app in Okta, then restart backend.
