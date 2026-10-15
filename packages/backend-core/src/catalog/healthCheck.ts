import type { HealthState } from './catalogTypes'

const MAX_TIMEOUT_MS = 5000

export interface HealthCheckResult {
  state: HealthState
  observedAt: Date
  checker: string
  detail?: string
}

export interface HealthChecker<TConfig> {
  name: string
  check: (
    config: TConfig,
    signal: AbortSignal,
  ) => Promise<Omit<HealthCheckResult, 'observedAt' | 'checker'>>
}

export interface HttpHealthCheckConfig {
  url: string
  expectStatus?: number
  bodyIncludes?: string
  timeoutMs?: number
}

export function sanitizeUrl(url: string): string | null {
  try {
    const u = new URL(url)
    u.username = ''
    u.password = ''
    u.search = ''
    u.hash = ''
    let result = u.toString()
    // Remove trailing slash added by URL() if the original pathname was just "/"
    if (u.pathname === '/' && !url.includes('/', url.indexOf('://') + 3)) {
      result = result.slice(0, -1)
    }
    return result
  } catch {
    return null
  }
}

export const httpHealthChecker: HealthChecker<HttpHealthCheckConfig> = {
  name: 'http',
  async check({ url, expectStatus, bodyIncludes }, signal) {
    // Create our own AbortController for fetch to avoid vitest context incompatibility
    const fetchController = new AbortController()
    const abortListener = () => fetchController.abort()
    signal.addEventListener('abort', abortListener)

    let res: Response
    try {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: fetchController.signal,
      })
    } catch (e) {
      const code = (e as { cause?: { code?: string } }).cause?.code
      const name = (e as Error).name
      // A name that does not resolve means the check is misconfigured, not that
      // the service is down.
      if (code === 'ENOTFOUND' || code === 'EAI_AGAIN')
        return { state: 'unknown', detail: code }
      if (name === 'AbortError' || fetchController.signal.aborted)
        return { state: 'down', detail: 'timeout' }
      return { state: 'down', detail: code ?? 'network error' }
    } finally {
      signal.removeEventListener('abort', abortListener)
    }
    const statusOk = expectStatus ? res.status === expectStatus : res.ok
    if (!statusOk) return { state: 'down', detail: `HTTP ${res.status}` }
    if (bodyIncludes && !(await res.text()).includes(bodyIncludes)) {
      return { state: 'degraded', detail: 'body mismatch' }
    }
    return { state: 'healthy' }
  },
}

export async function runCheck<TConfig>(
  checker: HealthChecker<TConfig>,
  config: TConfig,
  timeoutMs = MAX_TIMEOUT_MS,
): Promise<HealthCheckResult> {
  const controller = new AbortController()
  let timeoutId: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => {
        controller.abort()
        reject(new Error('timeout'))
      },
      Math.min(timeoutMs, MAX_TIMEOUT_MS),
    )
  })

  try {
    const r = await Promise.race([
      checker.check(config, controller.signal),
      timeout,
    ])
    return { ...r, observedAt: new Date(), checker: checker.name }
  } catch (e) {
    if (controller.signal.aborted) {
      return {
        state: 'down',
        detail: 'timeout',
        observedAt: new Date(),
        checker: checker.name,
      }
    }
    throw e
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  }
}

export async function runHealthChecks<T>(
  jobs: Array<{
    key: T
    run: (signal: AbortSignal) => Promise<HealthCheckResult>
  }>,
  { concurrency = 8 } = {},
) {
  const out: Array<{ key: T; result: HealthCheckResult }> = new Array(
    jobs.length,
  )
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
      while (next < jobs.length) {
        const i = next++
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS)
        try {
          out[i] = {
            key: jobs[i]!.key,
            result: await jobs[i]!.run(controller.signal),
          }
        } finally {
          clearTimeout(timeout)
        }
      }
    }),
  )
  return out
}
