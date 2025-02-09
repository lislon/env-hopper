import prisma from '../prisma';
import { DbReaderMapper, DbWriterMapper } from '../mappers';
import { EhEnv } from '@env-hopper/types';

export async function dbEnvsSet(data: EhEnv[]): Promise<void> {
  await prisma.$transaction([
    prisma.environment.deleteMany(),
    prisma.environment.createMany({ data: data.map(DbWriterMapper.ehEnv) }),
  ]);
}

export async function dbEnvsGet(): Promise<EhEnv[]> {
  const rows = await prisma.environment.findMany({
    orderBy: [
      {
        id: 'asc',
      },
    ],
  });
  return rows.map(DbReaderMapper.ehEnv);
}
