---
'@env-hopper/source-k8s': minor
---

Add `createK8sWatcher`: Deployments and Ingresses held as trimmed records and
kept current by one list-then-watch loop per kind, with `snapshot()`,
`status()` and an `onChange` callback for kept records that changed. An
expired version (410) relists and reports what changed meanwhile, deletions
included; other errors reconnect from the last version after a backoff; a
watchdog replaces a silent stream. `toWorkloadRecord` and `toIngressRecord`
are exported, and `watchFromKubeConfig` wraps the client's `Watch`.
