---
'@env-hopper/frontend-core': minor
---

Checks follow attention. While someone is looking (the page visible and a mouse move, scroll, key, focus or touch within 2 minutes) the open pair is checked every half freshness window; a stale line with nothing checking it is asked for again within 3 seconds, and at once when the pointer moves onto it. While the User is idle or the tab hidden, the line may go stale with no ring, and the next activity checks it. `useAttention` and `IDLE_MS` say whether someone is looking.
