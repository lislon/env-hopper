---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
---

A diagnostics panel for staging and previews: where the bootstrap's `ui.diagnostics` is on, `?debug=1` or Ctrl+Shift+D opens it under the Version line. It shows attention (attentive or idle, last activity), each `pair` fetch, answer and `pairsWatch` push the pair got with its freshness, and the backend's recent checks (`diagnostics`, from the deployment's `getDiagnostics`). "Copy diagnostics" copies them as JSON with secret-named keys dropped and credentials in strings replaced. The `diagnostics` query is NOT_FOUND (404) unless `ui.diagnostics` is on, and serves each event's detail made safe for a browser.
