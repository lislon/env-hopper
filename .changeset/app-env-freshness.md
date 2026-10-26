---
'@env-hopper/backend-core': minor
---

The Entity Provider writes how fresh each AppEnv is (`syncAppEnvFreshness`): when its reads were last confirmed, which Sources are being read now, and the last read that failed. The pair stream sends it in each AppEnv's deployment chunk, also when nothing is deployed there. Adds the `EhUser` and `UserEvent` tables for usage.
