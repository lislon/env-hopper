import type { PrismaClient as CorePrismaClient } from '@prisma/client'

export interface ApprovalMethodSyncInput {
  slug: string
  type: 'service' | 'personTeam' | 'custom'
  displayName: string
}

/**
 * Syncs approval methods to the database using upsert logic based on type + displayName.
 *
 * @param prisma - The PrismaClient instance from the backend-core database
 * @param methods - Array of approval methods to sync
 */
export async function syncApprovalMethods(
  prisma: CorePrismaClient,
  methods: Array<ApprovalMethodSyncInput>,
): Promise<void> {
  // Use transaction for atomicity
  await prisma.$transaction(
    methods.map((method) =>
      prisma.dbApprovalMethod.upsert({
        where: {
          slug: method.slug,
        },
        update: {
          displayName: method.displayName,
          type: method.type,
        },
        create: {
          slug: method.slug,
          type: method.type,
          displayName: method.displayName,
        },
      }),
    ),
  )
}
