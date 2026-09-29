---
'@env-hopper/frontend-core': minor
---

Read parameter behaviour flags from the `contexts` a deployment declares.

`isSharedAcrossEnvs` is served in `BootstrapConfigData.contexts`, which nothing
read, while the cross-cutting params context took its definitions from
`lateResolvableParams`, which nothing populates with that flag. Both are keyed by
the same slug vocabulary, so the flags are now joined onto the params a jump asks
for — meaning the environment-scoping behaviour works against data a deployment
already serves, with no configuration change.

Driven from the params, so a context with no matching parameter cannot become a
phantom one. A context wins only where it states a flag; otherwise whatever the
parameter itself declared is kept.
