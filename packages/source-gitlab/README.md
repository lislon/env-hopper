# @env-hopper/source-gitlab

Reads environments, deployments and releases from the GitLab REST API and
returns them as plain records. It holds no mapping of its own: which projects to
read, which deploy jobs count, and what a record means to your catalog are all
passed in by the caller.

No runtime dependencies; it uses the global `fetch` (or one you pass in).

## Install

```bash
npm install @env-hopper/source-gitlab
```

## Usage

```ts
import { createGitlabSource } from '@env-hopper/source-gitlab'

const source = createGitlabSource({
  baseUrl: 'https://gitlab.example.com',
  token: process.env.GITLAB_TOKEN!,
})

const projectId = 42

const environments = await source.listEnvironments(projectId)

const deployments = await source.latestDeployments(projectId, {
  jobNames: (name) => name.startsWith('deploy'),
})

const releases = await source.listReleases(projectId, { limit: 50 })
```

## License

MIT
