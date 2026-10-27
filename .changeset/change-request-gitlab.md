---
'@env-hopper/source-gitlab': minor
---

Reads merge requests: `getMergeRequest` (one by its number, null when GitLab
has none), `mergeRequestCommits` (one page of its commits, newest first) and
`commitMergeRequests` (the merge requests a commit belongs to, none for an
unknown commit), each as a `GitlabMergeRequestRecord` or `GitlabCommitRecord`.
