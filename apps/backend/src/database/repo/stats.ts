import prisma from '../prisma';
import { StatsJump } from '@prisma/client';

export async function dbStatsJumpInsert(
  jump: Omit<StatsJump, 'id'>,
): Promise<void> {
  await prisma.statsJump.create({
    data: jump,
  });
}

export async function dbStatsJumpsGet({
  limit,
}: {
  limit: number;
}): Promise<StatsJump[]> {
  return await prisma.statsJump.findMany({
    orderBy: [
      {
        id: 'desc',
      },
    ],
    take: limit,
  });
}
