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
  /** The EhUser the request comes from, by its cookie; null outside HTTP. */
  ehUserId: string | null
}

export interface EhTrpcContextOptions {
  companySpecificBackend: EhBackendCompanySpecificBackend
  user?: User | null
  adminGroups: Array<string>
  catalog?: Catalog | null
  ehUserId?: string | null
}

export function createEhTrpcContext({
  companySpecificBackend,
  user = null,
  adminGroups,
  catalog = null,
  ehUserId = null,
}: EhTrpcContextOptions): EhTrpcContext {
  return {
    companySpecificBackend,
    user,
    adminGroups,
    catalog,
    ehUserId,
  }
}

/** The cookie that names an EhUser: `eh_uid=<id>`. */
const EH_USER_COOKIE = /(?:^|;\s*)eh_uid=([\w-]{8,64})/
/** The longest a browser keeps a cookie (400 days). */
const EH_USER_COOKIE_MAX_AGE_S = 400 * 24 * 60 * 60

/**
 * The EhUser a request comes from: the id its cookie carries, or a new one,
 * with the cookie that keeps it (httpOnly: no script reads it).
 */
export function ehUserIdOf(req: IncomingMessage, res: ServerResponse): string {
  const held = EH_USER_COOKIE.exec(req.headers.cookie ?? '')?.[1]
  if (held) return held
  const id = randomUUID()
  const secure = req.headers['x-forwarded-proto'] === 'https'
  res.appendHeader(
    'Set-Cookie',
    `eh_uid=${id}; Path=/; Max-Age=${EH_USER_COOKIE_MAX_AGE_S}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`,
  )
  return id
}
