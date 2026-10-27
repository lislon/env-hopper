---
'@env-hopper/shared-core': minor
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
---

Send `bootstrap`'s Environments packed. Per field, the rule most Environments
follow (a constant, or a value built from the Environment's slug) goes once in
the new `envDefaults`, and each Environment carries only what differs; `null`
removes a default. `packEnvs` and `expandEnv` (shared-core) do the two halves,
and the server sends explicit any Environment that would not round-trip. Every
other `bootstrap` key is unchanged.
