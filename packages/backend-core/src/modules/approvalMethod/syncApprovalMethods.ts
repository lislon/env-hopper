import type { PrismaClient as CorePrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

export interface ApprovalMethodSyncInput {
  type: 'service' | 'personTeam' | 'custom'
  displayName: string
  config?: Record<string, unknown>
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
          type_displayName: {
            type: method.type,
            displayName: method.displayName,
          },
        },
        update: {
          config: method.config ?? Prisma.JsonNull,
        },
        create: {
          type: method.type,
          displayName: method.displayName,
          config: method.config ?? Prisma.JsonNull,
        },
      }),
    ),
  )

  console.log(
    `✓ Approval methods sync complete! Synced ${methods.length} methods`,
  )
}
