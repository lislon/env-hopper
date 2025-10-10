# Okta Setup Quick Start

## Get Credentials from Okta

1. **Okta Admin Dashboard** → Applications → Create App Integration
2. Choose **OIDC** → **Web Application**
3. Set redirect URIs:
   - Dev: `http://localhost:4001/api/auth/callback/okta`
   - Prod: `https://your-domain.com/api/auth/callback/okta`
4. Copy **Client ID**, **Client Secret**
5. Your **Issuer** = `https://your-org.okta.com` (without `/oauth2/default`)

## Configure .env

```env
AUTH_OKTA_CLIENT_ID=0oa1abc...
AUTH_OKTA_CLIENT_SECRET=your_secret...
AUTH_OKTA_ISSUER=https://my-org.okta.com
```

## Assign Users in Okta

1. Go to your app in Okta Admin Dashboard
2. **Assignments** tab → **Assign to Groups**
3. Select groups (e.g., "Everyone")
4. Done! All users in that group can now log in

## Test Login

```bash
cd examples/backend-example
pnpm run dev
# Go to frontend and click "Login with Okta"
```

## How Users Log In

1. Click "Login with Okta" button
2. Redirected to Okta login
3. User enters their Okta credentials
4. User is created/logged in to EnvHopper

## Allow Any User in Your Okta Org

Create a "Verified Okta User" account type in your app:

```typescript
// In frontend, after user is authenticated
if (user?.email?.endsWith('@mycompany.com')) {
  // Auto-verify as company user
}
```

Or assign at the group level in Okta (recommended for security).

See [okta-setup.md](./okta-setup.md) for complete documentation.
