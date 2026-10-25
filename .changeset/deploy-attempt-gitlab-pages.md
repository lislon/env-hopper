---
'@env-hopper/source-gitlab': minor
---

`latestDeployments` takes `pageLimit`: read at most that many pages, newest
first, and keep what they hold, for statuses so frequent (canceled runs) that
only the latest rows matter.
