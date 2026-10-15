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
    return u.toString()
  } catch {
    return null
  }
}

async function fetchWithTimeout(
  url: string,
  signal: AbortSignal,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      controller.abort()
      reject(new Error('timeout'))
    }, MAX_TIMEOUT_MS)
    signal.addEventListener('abort', () => {
      clearTimeout(id)
      controller.abort()
      reject(new Error('timeout'))
    })
  })

  try {
    return await Promise.race([
      fetch(url, { method: 'GET', redirect: 'manual' }),
      timeout,
    ])
  } catch (e) {
    controller.abort()
    throw e
  }
}

export const httpHealthChecker: HealthChecker<HttpHealthCheckConfig> = {
  name: 'http',
  async check({ url, expectStatus, bodyIncludes }, signal) {
    let res: Response
    try {
      res = await fetchWithTimeout(url, signal)
    } catch (e) {
      const msg = (e as Error).message
      const code = (e as { cause?: { code?: string } }).cause?.code
      // A name that does not resolve means the check is misconfigured, not that
      // the service is down.
      if (code === 'ENOTFOUND' || code === 'EAI_AGAIN')
        return { state: 'unknown', detail: code }
      return {
        state: 'down',
        detail: msg === 'timeout' ? 'timeout' : (code ?? 'network error'),
      }
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
  const timeout = setTimeout(
    () => controller.abort(),
    Math.min(timeoutMs, MAX_TIMEOUT_MS),
  )
  try {
    const r = await checker.check(config, controller.signal)
    return { ...r, observedAt: new Date(), checker: checker.name }
  } finally {
    clearTimeout(timeout)
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
