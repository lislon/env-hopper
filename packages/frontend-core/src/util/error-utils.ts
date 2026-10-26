export class DexieErrorWrapper extends Error {
  public readonly cause: Error
  constructor(inner: unknown) {
    super(inner instanceof Error ? inner.message : String(inner))
    this.name = 'DexieErrorWrapper'
    this.stack = inner instanceof Error ? inner.stack : undefined
    this.cause = inner instanceof Error ? inner : new Error(String(inner))
  }
}

export function isDexieError(error: unknown): error is DexieErrorWrapper {
  return error instanceof DexieErrorWrapper
}

export function isDexieMigrationError(error: unknown): boolean {
  if (error instanceof DexieErrorWrapper) {
    const cause = error.cause
    if (cause instanceof Error) {
      const errorName = cause.name.toLowerCase()
      const errorMessage = cause.message.toLowerCase()
      return (
        errorName.includes('upgradeerror') ||
        errorName.includes('versionerror') ||
        errorMessage.includes('upgrade') ||
        errorMessage.includes('migration') ||
        errorMessage.includes('version')
      )
    }
  }
  return false
}

/** A 5xx answer that is no API answer (not JSON): a load balancer's page while a pod is replaced. */
export class ServerRestartingError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status} from no running API`)
    this.name = 'ServerRestartingError'
  }
}

/** `fetch` for the API: a non-JSON 5xx fails as a `ServerRestartingError`, which says what it is. */
export const apiFetch: typeof fetch = async (input, init) => {
  const res = await globalThis.fetch(input, init)
  if (
    res.status >= 500 &&
    !(res.headers.get('content-type') ?? '').includes('json')
  ) {
    throw new ServerRestartingError(res.status)
  }
  return res
}

/** What a restarting backend looks like to the browser, said plainly. */
export const RESTARTING_TEXT = 'env-hopper is restarting · retrying'

/**
 * The answer came from no running API: a 5xx, or HTML where JSON was due
 * (the load balancer's page while a pod is replaced).
 */
export function isServerRestarting(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const e = error as Error & {
    meta?: { response?: { status?: number } }
    data?: { httpStatus?: number }
  }
  if (
    e instanceof ServerRestartingError ||
    e.cause instanceof ServerRestartingError
  )
    return true
  const status = e.meta?.response?.status ?? e.data?.httpStatus
  return (
    (status !== undefined && status >= 500) ||
    /Unexpected token '?<|is not valid JSON|Unexpected end of JSON/.test(
      e.message,
    )
  )
}

/** An error as a person reads it: a restarting backend is no error message. */
export function errorText(error: unknown): string {
  if (isServerRestarting(error)) return RESTARTING_TEXT
  return error instanceof Error ? error.message : String(error)
}
