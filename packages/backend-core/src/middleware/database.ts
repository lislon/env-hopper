import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import type { EhDatabaseConfig } from './types'
import { setDbClient } from '../db/client'

/**
 * Formats a database connection URL from structured config.
 */
function formatConnectionUrl(config: EhDatabaseConfig): string {
  if ('url' in config) {
    return config.url
  }

  const { host, port, database, username, password, schema = 'public' } = config
  return `postgresql://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=${schema}`
}

/**
 * Internal database manager used by the middleware.
 * Handles connection URL formatting and lifecycle.
 */
export class EhDatabaseManager {
  private client: PrismaClient | null = null
  private pool: pg.Pool | null = null
  private config: EhDatabaseConfig

  constructor(config: EhDatabaseConfig) {
    this.config = config
  }

  /**
   * Get or create the Prisma client instance.
   * Uses lazy initialization for flexibility.
   */
  getClient(): PrismaClient {
    if (!this.client) {
      const datasourceUrl = formatConnectionUrl(this.config)

      // Prisma 7 with adapter: Create pg pool and wrap with adapter
      this.pool = new pg.Pool({ connectionString: datasourceUrl })
      const adapter = new PrismaPg(this.pool)

      this.client = new PrismaClient({
        adapter,
        log:
          process.env.NODE_ENV === 'development'
            ? ['warn', 'error']
            : ['warn', 'error'],
      })

      // Bridge with existing backend-core getDbClient() usage
      setDbClient(this.client)
    }
    return this.client
  }

  async connect(): Promise<void> {
    const client = this.getClient()
    await client.$connect()
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.$disconnect()
      this.client = null
    }
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
  }
}
