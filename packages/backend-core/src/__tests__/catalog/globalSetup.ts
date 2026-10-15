import { execSync } from 'node:child_process'

export default function setup() {
  const url = process.env.EH_CORE_TEST_DATABASE_URL
  if (!url) {
    // secretlint-disable-next-line
    throw new Error(
      'EH_CORE_TEST_DATABASE_URL is required, e.g. postgres://env-hopper:env-hopper@localhost:55436/env-hopper?schema=eh_core_test (docker run -d --name eh-catalog-test-db -e POSTGRES_USER=env-hopper -e POSTGRES_PASSWORD=env-hopper -e POSTGRES_DB=env-hopper -p 55436:5432 postgres:16)',
    )
  }
  execSync('pnpm exec prisma migrate reset --force', {
    stdio: 'inherit',
    env: { ...process.env, EH_CORE_DATABASE_URL: url },
  })
}
