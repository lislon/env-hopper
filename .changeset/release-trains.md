---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
'@env-hopper/test-kit': minor
---

Release trains beside the form: the release production runs and the next two, each with its date and, when a source knows it, its time in the deployment's zone. A card on hover shows every source's date (disagreements flagged, never resolved), the instructions tickets, release notes, and the environments running the train with the build there. A deployment supplies them through the new optional `getReleaseTrains` on `EhBackendCompanySpecificBackend`; the `releaseTrains` procedure picks the trains and joins the deployments.
