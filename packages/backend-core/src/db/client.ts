import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

let prismaClient: PrismaClient | null = null
let pool: pg.Pool | null = null

/**
 * Gets the internal Prisma client instance.
 * Creates one if it doesn't exist.
 */
export function getDbClient(): PrismaClient {
  if (!prismaClient) {
    const databaseUrl = process.env.EH_CORE_DATABASE_URL
    if (!databaseUrl) {
      throw new Error(
        'PrismaClient not initialized. You must call createEhMiddleware() before using database functions, ' +
          'or set EH_CORE_DATABASE_URL environment variable for standalone usage.',
      )
    }

    // Prisma 7 with adapter: Create pg pool and wrap with adapter
    pool = new pg.Pool({ connectionString: databaseUrl })
    const adapter = new PrismaPg(pool)

    prismaClient = new PrismaClient({ adapter })
  }
  return prismaClient
}

/**
 * Sets the internal Prisma client instance.
 * Used by middleware to bridge with existing getDbClient() usage.
 */
export function setDbClient(client: PrismaClient): void {
  prismaClient = client
}

/**
 * Connects to the database.
 * Call this before performing database operations.
 */
export async function connectDb(): Promise<void> {
  const client = getDbClient()
  await client.$connect()
}

/**
 * Disconnects from the database.
 * Call this when done with database operations (e.g., in scripts).
 */
export async function disconnectDb(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect()
    prismaClient = null
  }
  if (pool) {
    await pool.end()
    pool = null
  }
}
