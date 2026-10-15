import { execSync } from 'node:child_process'

export default function setup({
  provide,
}: {
  provide: (key: string, value: unknown) => void
}) {
  const url = process.env.EH_CORE_TEST_DATABASE_URL
  const isCI = process.env.CI === 'true'

  if (!url) {
    const message = [
      'EH_CORE_TEST_DATABASE_URL is not set.',
      'To run catalog tests, start the dev database:',
      '  docker compose -f examples/backend-example/docker-compose.yml up -d db',
      'Or point to another instance:',
      // secretlint-disable-next-line
      '  export EH_CORE_TEST_DATABASE_URL=postgres://env-hopper:env-hopper@localhost:55436/env-hopper?schema=eh_example_test',
    ].join('\n')

    if (isCI) {
      throw new Error(message)
    }
    console.warn('\n⏭️  Skipping catalog tests (no database available)\n')
    console.warn(message)
    provide('catalogDbReady', false)
    return
  }

  try {
    execSync(
      'pnpm exec prisma migrate reset --force --schema=../../packages/backend-core/prisma/schema.prisma --config=../../packages/backend-core/prisma.config.ts',
      {
        stdio: 'pipe',
        env: { ...process.env, EH_CORE_DATABASE_URL: url },
      },
    )
    provide('catalogDbReady', true)
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
    provide('catalogDbReady', false)
  }
}
