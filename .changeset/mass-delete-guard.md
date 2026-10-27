---
'@env-hopper/backend-core': minor
---

Add opt-in guard to prevent mass deletions during catalog sync

Catalog syncs can now set `maxDeleteShare` (0..1) to refuse a run that would delete most of a table. When set and existing >= 5 and toDelete/existing > maxDeleteShare, no deletes happen (creates and updates still do), and the result includes `refusedDeletes` with the count it would have deleted. Protects against broken sources that suddenly return far fewer rows than normal.
