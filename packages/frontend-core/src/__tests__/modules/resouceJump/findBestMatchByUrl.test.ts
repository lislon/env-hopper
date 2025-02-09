import { objectify } from 'radashi'
import { describe, expect, it } from 'vitest'
import type {
  AvailiabilityMatrixData as AvailabilityMatrixData,
  AvailabilityVariant,
  EhEnvIndexed,
} from '@env-hopper/backend-core'
import type { ResourceJumpItem } from '~/modules/resourceJump/types'
import type {FindBestMatchingResourceJumpParams} from '~/modules/resourceJump/findBestMatchByUrl';
import {
  
  findBestMatchByUrl
} from '~/modules/resourceJump/findBestMatchByUrl'

function makeEnvs(
  envAsCommaSeparated: string | Array<string>,
): Record<string, EhEnvIndexed> {
  const envsArray = Array.isArray(envAsCommaSeparated)
    ? envAsCommaSeparated
    : envAsCommaSeparated.split(/\s*,\s*/)
  return objectify(
    envsArray,
    (slug) => slug,
    (slug) => ({ slug, displayName: slug }),
  )
}

function makeResourceJumps(
  resoucesAsCommaSeparated: string | Array<string>,
): Record<string, ResourceJumpItem> {
  const resourceArray = Array.isArray(resoucesAsCommaSeparated)
    ? resoucesAsCommaSeparated
    : resoucesAsCommaSeparated.split(/\s*,\s*/)
  return objectify(
    resourceArray,
    (slug) => slug,
    (slug) => ({ slug, type: 'resource' }),
  )
}

function parseUrl(url: string): {
  urlEnvSlug: string | undefined
  urlAppSlug: string | undefined
} {
  // 3 options
  // /env/{urlSlug}/app/{appSlug}
  // /env/{urlSlug}
  // /app/{appSlug}
  const envMatch = url.match(/\/env\/([^/]+)/)
  const appMatch = url.match(/\/app\/([^/]+)/)
  return {
    urlEnvSlug: envMatch ? envMatch[1] : undefined,
    urlAppSlug: appMatch ? appMatch[1] : undefined,
  }
}

describe('findBestMatchByUrl', () => {
  const envs = makeEnvs(['test-env', 'staging-env', 'prod-env'])
  const resourceJumps = makeResourceJumps(['test-app', 'appA', 'appB'])

  async function run(
    url: string,
    override: Partial<FindBestMatchingResourceJumpParams> = {},
  ): Promise<{
    env: string | undefined
    resourceJump: string | undefined
  }> {
    const { urlEnvSlug, urlAppSlug } = parseUrl(url)

    const matrixStr = `
        env/app    |  test-app  | appA | appB
        test-env   |  v         |      | x
        staging-env|            | x    | x
        prod-env   |            |      | x

        v - healthy & data & deployed
        x - unhealthy & data & deployed
        . - not deployed, no data, not health
        `

    const matrixData = parseMatrixStrToAvailabilityMatrix(matrixStr)

    const actual = await findBestMatchByUrl({
      urlEnvSlug: urlEnvSlug,
      urlAppSlug: urlAppSlug,
      envs: envs,
      resourceJumps: resourceJumps,
  getAvailabilityMatrix: async () => await Promise.resolve(matrixData),
      getNameMigrations: async (r) => {
        if (r.resourceSlug === 'old-app%2Fhome') {
          return await Promise.resolve({
            type: 'resourceRename',
            oldSlug: r.resourceSlug,
            targetSlug: 'test-app',
          })
        }
        return await Promise.resolve(false)
      },
      getEnvHistory: async () =>
        await Promise.resolve(
          ['staging-env', 'prod-env', 'test-env'].map((envSlug, index) => ({
            envSlug,
            timestamp: 100 - index,
          }))
        ),
      ...override,
    })

    return {
      env: actual.env?.slug,
      resourceJump: actual.resourceJump?.slug,
    }
  }

  it('env-only simple', async () => {
    expect(await run('/env/test-env')).toEqual({
      env: 'test-env',
      resourceJump: undefined,
    })
  })

  it('empty url', async () => {
    expect(await run('/')).toEqual({
      env: undefined,
      resourceJump: undefined,
    })
  })

  it('app-only simple', async () => {
    expect(
      await run('/app/test-app', { getEnvHistory: async () => [] }),
    ).toEqual({
      env: undefined,
      resourceJump: 'test-app',
    })
  })

  it('app & env simple', async () => {
    expect(await run('/env/test-env/app/test-app')).toEqual({
      env: 'test-env',
      resourceJump: 'test-app',
    })
  })

  it('migration: resourceName', async () => {
    expect(await run('/env/test-env/app/old-app%2Fhome')).toEqual({
      env: 'test-env',
      resourceJump: 'test-app',
    })
  })

  it('auto selection: env', async () => {
    expect(await run('/app/test-app')).toEqual({
      env: 'test-env',
      resourceJump: 'test-app',
    })
  })

  it('combo: auto selection + migration', async () => {
    expect(await run('/app/old-app%2Fhome')).toEqual({
      env: 'test-env',
      resourceJump: 'test-app',
    })
  })
})

function parseMatrixStrToAvailabilityMatrix(
  matrixStr: string,
): AvailabilityMatrixData {
  const lines = matrixStr
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.includes('|')) // only keep lines with matrix data

  if (lines.length === 0) {
    return {
      envSlugs: [],
      resourceJumpSlugs: [],
      availabilityVariants: [],
      matrix: [],
    }
  }

  // --- Parse header row ---
  const headerParts = lines[0]!.split('|').map((s) => s.trim())
  const resourceJumpSlugs = headerParts.slice(1)

  // --- Parse rows ---
  const envSlugs: Array<string> = []
  const matrix: Array<Array<number>> = []
  const variants: Array<AvailabilityVariant> = []
  const variantMap = new Map<string, number>() // maps symbol → variant index

  function registerVariant(symbol: string): number {
    if (!variantMap.has(symbol)) {
      let variant: AvailabilityVariant
      if (symbol === 'v') {
        variant = { isDeployed: true, isHealthy: true, hasData: true }
      } else if (symbol === 'x') {
        variant = { isDeployed: true, isHealthy: false, hasData: true }
      } else if (symbol === '.') {
        variant = { isDeployed: false, isHealthy: false, hasData: false }
      } else if (symbol === '' || symbol === ' ') {
        // treat empty cell as no deployment
        variant = { isDeployed: false, isHealthy: false, hasData: false }
        symbol = '.'
      } else {
        throw new Error(`Unknown symbol '${symbol}'`)
      }
      variantMap.set(symbol, variants.length)
      variants.push(variant)
    }
    return variantMap.get(symbol)!
  }

  for (const line of lines.slice(1)) {
    const parts = line.split('|').map((s) => s.trim())
    const env = parts[0]!
    envSlugs.push(env)

    const row: Array<number> = []
    for (let j = 1; j < parts.length; j++) {
      const cell = parts[j]
      const symbol = cell || '.' // normalize empty → "."
      const idx = registerVariant(symbol)
      row.push(idx)
    }
    matrix.push(row)
  }

  return {
    envSlugs,
    resourceJumpSlugs,
    availabilityVariants: variants,
    matrix,
  }
}
