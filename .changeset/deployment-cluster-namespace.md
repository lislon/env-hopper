---
'@env-hopper/backend-core': minor
'@env-hopper/frontend-core': minor
---

A pair's Deployment row names where a cluster runs it: `cluster`, `namespace`
and `kubeContext`, from its Target's `meta` of the same names. The deployed
version's tooltip and details show `cluster/namespace`, and the kubernetes
commands beside the form use the context and namespace of the selected app's
lead Component when the catalog knows them, else the environment's own.
