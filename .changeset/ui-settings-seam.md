---
'@env-hopper/frontend-core': minor
'@env-hopper/shared-core': minor
---

Add a UI settings seam so a consuming app can contribute content inside core layouts.

`App` takes an optional `uiSettings` prop (`EhUiSettings`) carrying a footer slot,
about pages and templated app links; `useUiSettings()` and `useEhTemplate()` are
exported for consumers. `useEhTemplate()` resolves `{{app.*}}`, `{{env.*}}` and the
selected environment's template params, and `substituteTemplate` now understands a
`{{key ?? default}}` operator — including an empty default.
