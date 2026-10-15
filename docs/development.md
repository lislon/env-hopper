# Development docs

## How to publish

`main` is the only long-lived branch. Open a PR against it and add a changeset
(`pnpm changeset`, `minor` or `patch`). Merging that PR publishes `@latest`; a
merge without a changeset publishes nothing. Every PR also gets a preview build
on pkg.pr.new.

A major version is refused unless approved. To release one, rerun CI on `main`
with approval:

```
gh workflow run ci -r main -f allow_major=true
```
