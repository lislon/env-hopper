# @env-hopper/source-gitlab

Read deployments, environments and releases from a GitLab instance.

## Installation

```bash
npm install @env-hopper/source-gitlab
# or
pnpm add @env-hopper/source-gitlab
```

## Usage

```typescript
import { createGitlabSource } from '@env-hopper/source-gitlab'

const source = createGitlabSource({
  baseUrl: 'https://gitlab.example.com',
  token: 'your-token',
})

// List environments for a project
const envs = await source.listEnvironments(7)

// Get latest successful deployments
const deploys = await source.latestDeployments(7, {
  jobNames: (name) => name.startsWith('deploy'),
})

// List releases
const releases = await source.listReleases(7, { limit: 50 })
```

## License

MIT
