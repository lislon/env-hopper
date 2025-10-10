# Okta Authentication Setup Guide

This guide explains how to configure Okta OIDC (OpenID Connect) with EnvHopper to allow authentication for any user in your Okta organization.

## Prerequisites

- An Okta organization (create one at [okta.com](https://okta.com))
- Users already created in your Okta organization
- Your Okta organization URL (e.g., `https://my-org.okta.com`)

## Step 1: Create an Okta Application

1. Log in to your Okta Admin Dashboard
2. Go to **Applications** > **Applications**
3. Click **Create App Integration**
4. Choose **OIDC - OpenID Connect** as the sign-in method
5. Select **Web Application** as the application type
6. Click **Next**

## Step 2: Configure Application Settings

Fill in the following details:

**General Settings:**
- **App name**: EnvHopper (or your app name)
- **App logo**: Optional

**Sign-in redirect URIs:**
- `http://localhost:4001/api/auth/callback/okta` (for local development)
- `https://your-domain.com/api/auth/callback/okta` (for production)

**Sign-out redirect URIs:**
- `http://localhost:4001` (development)
- `https://your-domain.com` (production)

**Allowed grant types:**
- ✅ Authorization Code
- ✅ Refresh Token
- ✅ Implicit (if using implicit flow)

Click **Save**

## Step 3: Get Your Credentials

After creating the app, you'll see the credentials page:

1. Copy your **Client ID**
2. Click **Show Client Secret** and copy the **Client Secret**
3. Your **Okta Issuer** is: `https://your-org.okta.com` (without `/oauth2/default`)

## Step 4: Configure Environment Variables

In `examples/backend-example/.env`, add:

```env
# Okta OIDC Configuration
AUTH_OKTA_CLIENT_ID=0oa1abc2defGHIjk0h7
AUTH_OKTA_CLIENT_SECRET=your_client_secret_here
AUTH_OKTA_ISSUER=https://my-org.okta.com
```

## Step 5: Optional - User Assignment

To allow **any user** in your Okta organization:

### Option A: Assign Everyone (Recommended for internal apps)
1. In your app settings, go to **Assignments** tab
2. Click **Assign** > **Assign to Groups**
3. Select the group (e.g., "Everyone" or your main group)
4. Click **Assign**

Users in that group can now log in.

### Option B: Allow Unauthenticated Access
For public apps, configure in your Okta app:
1. Go to **General** settings
2. Under **Client Credentials**, ensure the client type allows your use case
3. Set up any necessary authorization policies

## Step 6: Test the Integration

1. Start your backend:
```bash
cd examples/backend-example
pnpm run dev
```

2. Navigate to frontend login or click "Login with Okta"

3. You'll be redirected to Okta login
4. Enter your Okta credentials
5. You'll be redirected back and logged into EnvHopper

## How It Works

The authentication flow:

```
1. User clicks "Login with Okta"
   ↓
2. Frontend redirects to Okta authorization endpoint
   ↓
3. User logs in with Okta credentials (or uses existing session)
   ↓
4. Okta redirects back to your app with authorization code
   ↓
5. Backend exchanges code for ID token and access token
   ↓
6. User account is created/updated in your database
   ↓
7. Session is established
```

## Frontend Configuration

The frontend automatically supports Okta login through the auth hooks:

```tsx
import { useAuthActions } from '~/modules/auth'

function LoginComponent() {
  const { socialLogin } = useAuthActions()
  
  return (
    <button onClick={() => socialLogin('okta')}>
      Login with Okta
    </button>
  )
}
```

## User Information Mapping

When a user logs in via Okta, the following information is captured:

| Okta Claim | EnvHopper Field | Notes |
|-----------|-----------------|-------|
| `sub` | User ID | Unique identifier |
| `email` | Email | May be verified depending on Okta config |
| `name` | Name | Full name from Okta profile |
| `picture` | Image | Profile picture URL |

## Okta User Permissions

To manage which users can access your app:

### In Okta:
1. Go to **Users** in Admin Dashboard
2. Each user can be assigned to groups
3. Assign users/groups to your EnvHopper application
4. Users not assigned won't get an error, but won't be in your org's access list

### In EnvHopper:
You can add role-based access control based on user information:

```tsx
// Future enhancement: role-based access
if (user?.email?.endsWith('@mycompany.com')) {
  // Grant access to admin features
}
```

## Troubleshooting

**Issue: "Invalid client" error**
- Verify Client ID and Client Secret are correct
- Check that credentials haven't been regenerated (old ones won't work)

**Issue: Redirect URI mismatch**
- Ensure the callback URL in Okta matches exactly: `http://localhost:4001/api/auth/callback/okta`
- Include the full path, including `/api/auth/callback/okta`

**Issue: User not found after login**
- Verify the user is assigned to the application in Okta
- Check that assignment propagation has completed (may take a moment)

**Issue: CORS or "origin not allowed" error**
- Verify `BETTER_AUTH_URL` matches your frontend URL
- Ensure Okta app's redirect URIs include your current URL

## Production Deployment

When deploying to production:

1. Update redirect URIs in Okta app settings to your production domain
2. Use environment variables for credentials (never hardcode)
3. Ensure `BETTER_AUTH_URL` is set to your production domain
4. Set `BETTER_AUTH_SECRET` to a strong, random 32+ character string
5. Enable `useSecureCookies: true` in production (already configured)

Example production `.env`:
```env
AUTH_OKTA_CLIENT_ID=prod_client_id
AUTH_OKTA_CLIENT_SECRET=prod_secret
AUTH_OKTA_ISSUER=https://my-org.okta.com
BETTER_AUTH_URL=https://app.mydomain.com
BETTER_AUTH_SECRET=generated-secret-minimum-32-chars
```

## Advanced: Custom Scopes

If you need additional user information, you can request additional scopes. Add to the Okta provider config:

```typescript
providers.okta = {
  clientId: process.env.AUTH_OKTA_CLIENT_ID,
  clientSecret: process.env.AUTH_OKTA_CLIENT_SECRET,
  issuer: process.env.AUTH_OKTA_ISSUER,
  scopes: ['openid', 'email', 'profile', 'groups'], // Request groups claim
}
```

Then you can access group information in user metadata.

## References

- [Okta Developer Console](https://developer.okta.com/)
- [Okta OIDC Documentation](https://developer.okta.com/docs/guides/implement-oauth-for-okta/)
- [Better Auth Okta Integration](https://better-auth.com/docs/integrations)
- [OpenID Connect Specification](https://openid.net/connect/)
