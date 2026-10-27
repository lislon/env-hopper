---
'@env-hopper/source-k8s': minor
---

`withBearerToken(kc, token)` makes every API call and watch over a KubeConfig
carry `Authorization: Bearer <token()>`, asked per request, and
`cachedToken(mint, { refreshBeforeMs })` reuses a minted token until shortly
before it expires. Together they read a cluster whose tokens are short-lived.
