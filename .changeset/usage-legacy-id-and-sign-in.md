---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
'@env-hopper/test-kit': minor
---

A browser keeps the id the previous UI gave it: `usage.record` takes an optional `legacyUserId`, and a browser with no `eh_uid` cookie is named by it when it is a UUID (else by a new one). The cookie is set by the first `usage.record`, not by any request. Signing in links the browser to the account for good: `EhUser.userId` is set at its first sign-in and never changed; one account may own several browsers. `getUserEvents(since, { userId })` returns a User's history across every browser linked to the same account, and each event names its `ehUserId` and, once linked, its `userId`. The context takes `ehUser: ehUserOf(req, res)`.
