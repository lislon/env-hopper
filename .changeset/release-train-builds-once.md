---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
'@env-hopper/test-kit': minor
---

Release-train card: each build is named once with the environments running it, plus a link to its commit (from the Component's `commitUrl`); a long build name ends in "…" instead of leaving the card; an upcoming train can link its release branch (`ReleaseTrain.releaseBranch`); dates outside this year show the year; "your time" drops UTC; the row shows a pointer and a click pins the card. No layout shift on revisit: each App's last answer is kept per device and favourite and recent Apps are prefetched (ADR 0008).
