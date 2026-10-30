---
'@env-hopper/frontend-core': patch
---

The deployed version's tooltip no longer says "May be out of date" for a version confirmed within its freshness window just because a check is running again; it says "Up to date · checked 5 s ago · checking audit now…". And an App whose lead Component is not deployed no longer shows the "not every component runs this version" star.
