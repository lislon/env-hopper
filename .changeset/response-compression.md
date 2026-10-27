---
'@env-hopper/backend-core': minor
---

Compress responses with gzip or brotli. `ehCompression()` is exported for
servers built without `createEhMiddleware`, which now mounts it first.
Streamed queries and server-sent events stay streamed: each chunk is flushed
the moment it is written.
