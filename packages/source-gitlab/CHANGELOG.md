# @env-hopper/source-gitlab

## 2.1.0

### Minor Changes

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Reads merge requests: `getMergeRequest` (one by its number, null when GitLab
  has none), `mergeRequestCommits` (one page of its commits, newest first) and
  `commitMergeRequests` (the merge requests a commit belongs to, none for an
  unknown commit), each as a `GitlabMergeRequestRecord` or `GitlabCommitRecord`.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - - An Artifact stores the commit it was built from (`commitSha`), and a
  Component the page of a commit of its code (`commitUrl`, with `{{sha}}`).
  A pair's row carries `commitSha` and its Component `commitUrl`; the
  deployed-version details show a Commit column with the short sha linked to
  that page, and link the Version to its build pipeline.
  - A GitLab deployment record names who ran its deploy job (`jobUser`) beside
    `user`, who created the record.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - `latestDeployments` takes `pageLimit`: read at most that many pages, newest
  first, and keep what they hold, for statuses so frequent (canceled runs) that
  only the latest rows matter.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Each deployment record says when its deploy job started (`startedAt`, null
  when the job never started, as for most canceled runs) and links the job
  itself (`jobUrl`), so a running, failed or canceled deploy can be shown with
  its start and its job.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Reads for naming builds: a release's own `name`, `searchTags(projectId, search)` (GitLab's `^x` / `x$` search, newest first) and `rawFile(projectId, path, ref)` (a file's text at a ref or commit; null where it does not exist).

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - `getPipeline(projectId, id)` describes one pipeline: its ref, commit, whether
  the ref is a tag, and what started it (`push`, `api`, `parent_pipeline`, …).
  A pipeline never changes, so a caller can keep the answer for good.

- [#410](https://github.com/lislon/env-hopper/pull/410) [`21722da`](https://github.com/lislon/env-hopper/commit/21722dad6658c44d123dfc01b19ece2b2dfc19fd) Thanks [@lislon](https://github.com/lislon)! - Add `@env-hopper/source-gitlab`, which reads GitLab environments, deployments
  and releases for the catalog. Deployment reads can start from a date, one
  environment can be read with its last deployment, and a deployment carries the
  deploy pipeline's creation time, the commit time and whether a tag was
  deployed. Paging is bounded.
