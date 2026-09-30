---
'@env-hopper/test-kit': patch
---

Stop a peer-dependent from turning a minor release into a major one.

`test-kit` peer-depends on the two cores, and changesets escalates a
peer-dependent to `major` whenever one of its peers takes a `minor` — even when
the new version still satisfies the declared range. With every package in one
`fixed` group, that escalation spread to all of them, so seven `minor` changesets
released as 3.0.0 with nothing having asked for it.

`onlyUpdatePeerDependentsWhenOutOfRange` limits the escalation to the case it
exists for: a peer moving outside the range. A release with these same changesets
now computes 2.1.0.

A guard runs after `changeset version` on both release paths and fails if any
package's major went up, so the next one cannot happen quietly. Releasing a major
on purpose means dispatching the workflow with `allow_major=true`.
