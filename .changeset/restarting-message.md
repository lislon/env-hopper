---
'@env-hopper/frontend-core': minor
---

While the backend is being replaced, a 5xx answer that is not the API's own (a load balancer's HTML page) says "env-hopper is restarting Â· retrying" and is retried quietly, instead of showing the raw parse error. The API's fetch (`apiFetch`) turns such an answer into a `ServerRestartingError`; `errorText` and `isServerRestarting` read it.
