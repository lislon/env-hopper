import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { PrismaClient } from '../../generated/prisma/client'

let client: PrismaClient | undefined
export function getTestCatalogClient(): PrismaClient {
  client ??= new PrismaClient({
    adapter: new PrismaPg(
      new pg.Pool({ connectionString: process.env.EH_CORE_TEST_DATABASE_URL }),
      {
        schema:
          new URL(process.env.EH_CORE_TEST_DATABASE_URL!).searchParams.get(
            'schema',
          ) ?? 'public',
      },
    ),
  })
  return client
}

export async function resetCatalog(prisma: PrismaClient): Promise<void> {
  const schema =
    new URL(process.env.EH_CORE_TEST_DATABASE_URL!).searchParams.get(
      'schema',
    ) ?? 'public'
  await prisma.$executeRawUnsafe(`SET search_path TO "${schema}"`)
  await prisma.$executeRawUnsafe(
    'TRUNCATE "CatalogEndpoint","CatalogHealth","CatalogDeployment","CatalogArtifact","CatalogRelease","CatalogDeploymentTarget","CatalogComponent","CatalogApp","CatalogEnvironment" CASCADE',
  )
}
