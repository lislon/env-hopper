---
'@env-hopper/frontend-core': minor
'@env-hopper/backend-core': minor
---

Give the version dialog structured rows, icons and a line saying what the app is for.

The dialog a deployment opens from the version label took a single `versionHtml`
blob and rendered it through `dangerouslySetInnerHTML`, which made the backend own
this layout and put server-built markup on the page. It now takes
`versionRows` — an icon id, a label, a value, an optional href and a one-line
description each — plus `versionCredit` and `versionBuiltAt`. Icon ids resolve
against the same `icons` list the app-link rows already use, and an id nothing
shipped costs the row its icon, not the row.

The core contributes the two rows true of every deployment: the package version it
runs on and the project home. A short line under the title says what the app does,
so the dialog reads as an about box rather than a build stamp.
