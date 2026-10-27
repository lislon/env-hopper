---
'@env-hopper/backend-core': minor
---

An audit trail of what each AppEnv showed: `DeploymentHistory` gets a row each time a sync makes a Deployment appear, change its version or deploy time (a redeploy), or go, and each time an attempt starts or changes status. It is written in the same transaction as the change and never updated or deleted. `getDeploymentHistory({ app?, env?, component?, from?, to? })` reads it, newest first, at most 1000 rows.
