import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HINT = [
  'To run catalog tests, start the dev database:',
  '  docker compose -f examples/backend-example/docker-compose.yml up -d db',
  'Or point to another instance:',
  // secretlint-disable-next-line
  '  export EH_CORE_TEST_DATABASE_URL=postgres://env-hopper:env-hopper@localhost:5532/env-hopper?schema=eh_core_test',
]

/** The schema the tests own; `prisma migrate reset` drops all of it. */
function testSchema(url: string): string | null {
  try {
    return new URL(url).searchParams.get('schema')
  } catch {
    return null
  }
}

export default function setup({
  provide,
}: {
  provide: (key: string, value: unknown) => void
}) {
  const url = process.env.EH_CORE_TEST_DATABASE_URL
  const isCI = process.env.CI === 'true'

  if (!url) {
    const message = ['EH_CORE_TEST_DATABASE_URL is not set.', ...HINT].join(
      '\n',
    )

    if (isCI) {
      throw new Error(message)
    }
    console.warn('\n⏭️  Skipping catalog tests (no database available)\n')
    console.warn(message)
    provide('catalogDbReady', false)
    return
  }

  const schema = testSchema(url)
  if (!schema || schema === 'public') {
    // The reset below drops every table in the schema: never let it be public.
    throw new Error(
      [
        'EH_CORE_TEST_DATABASE_URL must name a dedicated test schema (?schema=…, not public),',
        'because the catalog tests reset that whole schema.',
        ...HINT,
      ].join('\n'),
    )
  }

  try {
    execSync(
      'pnpm exec prisma migrate reset --force --schema=prisma/schema.prisma --config=prisma.config.ts',
      {
        stdio: 'pipe',
        // src/testing and dist/testing both sit two levels below the package root
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        env: { ...process.env, EH_CORE_DATABASE_URL: url },
        encoding: 'utf8',
      },
    )
    provide('catalogDbReady', true)
  } catch (error: unknown) {
    const stderr = (error as { stderr?: string }).stderr || ''
    const stdout = (error as { stdout?: string }).stdout || ''
    const message = [
      'Failed to connect to test database.',
      ...HINT,
      '',
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      stderr ? `\nStderr: ${stderr}` : '',
      stdout ? `\nStdout: ${stdout}` : '',
    ].join('\n')

    if (isCI) {
      throw new Error(message)
    }
    console.warn('\n⏭️  Skipping catalog tests (database unreachable)\n')
    console.warn(message)
    provide('catalogDbReady', false)
  }
}
