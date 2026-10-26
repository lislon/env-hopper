---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
'@env-hopper/test-kit': minor
---

What a User does is kept: `usage.record` stores each `open` of an AppEnv and each `jump` from it as a `UserEvent`, under an `EhUser` named by an httpOnly `eh_uid` cookie (and the login, once signed in). The Catalog reads them back with `getUserEvents(since)`. A deployment's backend may implement `warm(appEnvs, reason)`: it is told which AppEnvs someone looks at now, to read what they show again. The frontend records an `open` when the page shows another AppEnv, and a `jump` when a link is followed. The test kit's mock backend answers `usage.record`.
