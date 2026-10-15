import { execSync } from 'node:child_process'

export default function setup() {
  const url = process.env.EH_CORE_TEST_DATABASE_URL
  const isCI = process.env.CI === 'true'

  if (!url) {
    const message = [
      'EH_CORE_TEST_DATABASE_URL is not set.',
      'To run catalog tests, start the dev database:',
      '  docker compose -f examples/backend-example/docker-compose.yml up -d db',
      'Or point to another instance:',
      // secretlint-disable-next-line
      '  export EH_CORE_TEST_DATABASE_URL=postgres://env-hopper:env-hopper@localhost:5532/env-hopper?schema=eh_core_test',
    ].join('\n')

    if (isCI) {
      throw new Error(message)
    }
    console.warn('\n⏭️  Skipping catalog tests (no database available)\n')
    console.warn(message)
    return
  }

  try {
    execSync('pnpm exec prisma migrate reset --force', {
      stdio: 'pipe',
      env: { ...process.env, EH_CORE_DATABASE_URL: url },
    })
  } catch (error) {
    const message = [
      'Failed to connect to test database.',
      'To run catalog tests, start the dev database:',
      '  docker compose -f examples/backend-example/docker-compose.yml up -d db',
      'Or point to another instance:',
      // secretlint-disable-next-line
      `  export EH_CORE_TEST_DATABASE_URL=${url}`,
      '',
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    ].join('\n')

    if (isCI) {
      throw new Error(message)
    }
    console.warn('\n⏭️  Skipping catalog tests (database unreachable)\n')
    console.warn(message)
  }
}
