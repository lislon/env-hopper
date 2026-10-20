---
'@env-hopper/backend-core': minor
'@env-hopper/source-gitlab': minor
'@env-hopper/frontend-core': minor
---

- An Artifact stores the commit it was built from (`commitSha`), and a
  Component the page of a commit of its code (`commitUrl`, with `{{sha}}`).
  A pair's row carries `commitSha` and its Component `commitUrl`; the
  deployed-version details show a Commit column with the short sha linked to
  that page, and link the Version to its build pipeline.
- A GitLab deployment record names who ran its deploy job (`jobUser`) beside
  `user`, who created the record.
