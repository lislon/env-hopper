import type { KubeConfig } from '@kubernetes/client-node'

/** A bearer token and the moment the API server stops accepting it. */
export interface ExpiringToken {
  token: string
  expiresAt: Date
}

export interface CachedTokenOpts {
  /** Mint a new token this long before the current one expires. */
  refreshBeforeMs?: number
  now?: () => number
}

/**
 * The token `mint` gave last, until `refreshBeforeMs` before it expires.
 * Concurrent callers share one mint; a failed mint is not kept, so the next
 * call tries again.
 */
export function cachedToken(
  mint: () => Promise<ExpiringToken>,
  { refreshBeforeMs = 60_000, now = Date.now }: CachedTokenOpts = {},
): () => Promise<string> {
  let current: ExpiringToken | undefined
  let pending: Promise<ExpiringToken> | undefined
  return async () => {
    if (current && current.expiresAt.getTime() - refreshBeforeMs > now()) {
      return current.token
    }
    pending ??= mint()
      .then((t) => (current = t))
      .finally(() => (pending = undefined))
    return (await pending).token
  }
}

type WithHeaders = { headers?: Record<string, unknown> }

/**
 * `kc` with every request carrying `Authorization: Bearer <token()>`, asked
 * per request, so a provider can rotate it. Cluster, CA and contexts stay
 * `kc`'s. API clients made from it and a `Watch` over it both authenticate
 * through `applyToRequest`.
 */
export function withBearerToken(
  kc: KubeConfig,
  token: () => Promise<string>,
): KubeConfig {
  const authed = Object.create(kc) as KubeConfig
  const bearer = async (opts: WithHeaders) => {
    opts.headers = { ...opts.headers, Authorization: `Bearer ${await token()}` }
  }
  authed.applyToRequest = async (opts) => {
    await kc.applyToRequest(opts)
    await bearer(opts as WithHeaders)
  }
  authed.applyToHTTPSOptions = async (opts) => {
    await kc.applyToHTTPSOptions(opts)
    await bearer(opts as WithHeaders)
  }
  return authed
}
