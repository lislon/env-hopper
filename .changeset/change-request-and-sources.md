---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
'@env-hopper/test-kit': minor
---

A change request is one line: its Work Items, each linked to its page when the bootstrap's `ui.workItemUrl` (a template with `{{key}}`) says where they live, then its title, linked to the change request. Its description is no longer shown. The details dialog has a "Read from" row (the Source each Version came from) and a footer naming each Source the AppEnv is read from and when (`AppEnvFreshness.sources`, a new nullable column). The test kit's fixture takes `ui`.
