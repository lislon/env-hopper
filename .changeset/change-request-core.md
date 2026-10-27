---
'@env-hopper/backend-core': minor
---

An Artifact keeps the change request it was built from, or that merged it into
the branch it was built from, as a `ChangeRequestRef` (`id`, `url`, optional
`title` and `workItems`, and `direct`). A pair's Deployment row and its Deploy
Attempt carry their build's as `changeRequest`; a row whose build has none is
unchanged. `CatalogArtifactInput.changeRequest` takes the ref instead of the
bare id. The new `changeRequestDetails` query asks the deployment's optional
`getChangeRequestDetails` for a change request's description and sends its
first 2048 characters, or an empty one when the deployment keeps none.
