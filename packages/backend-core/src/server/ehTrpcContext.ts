import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { EhBackendCompanySpecificBackend } from '../types'
import type { User } from 'better-auth/types'
import type { Catalog } from '../catalog'

export interface EhTrpcContext {
  companySpecificBackend: EhBackendCompanySpecificBackend
  user: User | null
  adminGroups: Array<string>
  /** The deployment catalog, when the deployment keeps one. */
  catalog: Catalog | null
  /** The EhUser the request comes from; null outside HTTP. */
  ehUser: ReturnType<typeof ehUserOf> | null
}

export interface EhTrpcContextOptions {
  companySpecificBackend: EhBackendCompanySpecificBackend
  user?: User | null
  adminGroups: Array<string>
  catalog?: Catalog | null
  ehUser?: ReturnType<typeof ehUserOf> | null
}

export function createEhTrpcContext({
  companySpecificBackend,
  user = null,
  adminGroups,
  catalog = null,
  ehUser = null,
}: EhTrpcContextOptions): EhTrpcContext {
  return {
    companySpecificBackend,
    user,
    adminGroups,
    catalog,
    ehUser,
  }
}

/** The cookie that names an EhUser: `eh_uid=<id>`. */
const EH_USER_COOKIE = /(?:^|;\s*)eh_uid=([\w-]{8,64})/
/** The longest a browser keeps a cookie (400 days). */
const EH_USER_COOKIE_MAX_AGE_S = 400 * 24 * 60 * 60
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The EhUser a request comes from, by its cookie (httpOnly: no script reads
 * it), and how to name a browser that has none: `name` sets the cookie to
 * `legacyId`, the id the previous UI kept for this browser, when it is a
 * UUID, else to a new one, and returns it.
 */
export function ehUserOf(
  req: IncomingMessage,
  res: ServerResponse,
): { id: string | null; name: (legacyId?: string) => string } {
  const id = EH_USER_COOKIE.exec(req.headers.cookie ?? '')?.[1] ?? null
  return {
    id,
    name: (legacyId) => {
      if (id) return id
      const named = legacyId && UUID.test(legacyId) ? legacyId : randomUUID()
      const secure = req.headers['x-forwarded-proto'] === 'https'
      res.appendHeader(
        'Set-Cookie',
        `eh_uid=${named}; Path=/; Max-Age=${EH_USER_COOKIE_MAX_AGE_S}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`,
      )
      return named
    },
  }
}
