import { createFullBackend } from './simpleDSL'

export const BackendMagazine = {
  default: () => {
    return createFullBackend({
      apps: [
        { slug: 'app1', resourceJumps: '2-pager' },
        { slug: 'app2', resourceJumps: '1-pager' },
        { slug: 'app3', resourceJumps: '2-pager' },
      ],
      envs: [{ slug: 'dev' }, { slug: 'staging' }, { slug: 'prod' }],
    })
  },
}
