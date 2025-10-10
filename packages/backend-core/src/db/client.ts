import { PrismaClient } from '@prisma/client'

let prismaClient: PrismaClient | null = null

/**
 * Gets the internal Prisma client instance.
 * Creates one if it doesn't exist.
 */
export function getDbClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient()
  }
  return prismaClient
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
}
