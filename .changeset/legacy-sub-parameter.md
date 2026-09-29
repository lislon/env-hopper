---
'@env-hopper/frontend-core': minor
'@env-hopper/backend-core': minor
---

Make the value a legacy `/sub/<value>` link carries work again, and give parameters two behaviours they were missing.

- A `/env/<env>/app/<app>/sub/<value>` link now routes, prefills, and produces a
  fully substituted target url. Nothing matched the `sub` segment before, and the
  value was stored under a slug no url template names, so it was silently dropped.
  Links the app emits (url sync, Share) keep the value too.
- `LateResolvableParam` gains `isSharedAcrossEnvs`: a value that means the same
  thing everywhere survives an environment switch, one scoped to an environment
  no longer follows the user to where it does not exist.
- `LateResolvableParam` gains `isBrowserAutocomplete`, and the parameter field
  carries a stable `name`, so a parameter can opt in to the browser suggesting a
  user's earlier values. Off by default.
