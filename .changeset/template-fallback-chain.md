---
'@env-hopper/shared-core': minor
'@env-hopper/frontend-core': minor
---

Let a url template follow a fallback chain and a two-hop pattern, so a shared url shape is configured once instead of per environment.

- The right side of `??` is now tried as a parameter key before being treated as
  a literal, and chains of any length are evaluated left to right with the first
  hit winning: `{{env.meta.baseUrl ?? app.meta.baseUrl ?? https://example.com}}`.
  An empty right side still means "substitute nothing".
- A substituted value may itself contain placeholders and they are resolved too,
  capped at `MAX_TEMPLATE_PASSES` (2) — enough for a pattern named at app level
  to be filled in with per-environment values. Only the text a pass substituted
  in is scanned again, never the rest of the string, so a value a user typed can
  never be read as template syntax and a self-referential key terminates.
- A jump url can resolve against the app's environment-independent placeholders,
  ranked below environment params, the jump's per-environment params, and the
  values the user supplies.
