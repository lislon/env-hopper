---
'@env-hopper/frontend-core': minor
---

Serve the real bootstrap config to the client, so meta-driven templates can resolve.

`BootstrapConfigProvider` was handed a hardcoded empty object with its query
commented out, so `{{app.meta.*}}` and `{{env.meta.*}}` resolved against nothing.
The query is wired back, deliberately without gating the app on it: the provider
falls back to an empty config, which degrades exactly as an unresolved template
already does rather than turning a bootstrap failure into a permanent loading
screen.

Also fixes the query reading `['config']` while its own background refresh wrote
`['bootstrapConfig']`, which left the client a fetch behind until a reload.
