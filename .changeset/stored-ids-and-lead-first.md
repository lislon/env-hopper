---
'@env-hopper/frontend-core': minor
---

- Stored favourites, jump history and the last-used app follow app renames:
  once the apps are known, each stored id no app has is looked up with
  `tryFindRenameRule` and moved to the new name.
- The deployed-version details list the lead Component first.
