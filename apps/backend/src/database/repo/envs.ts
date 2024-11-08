import prisma from '../prisma';
import { DbReaderMapper, DbWriterMapper } from '../mappers';
import { EhEnv } from '@env-hopper/types';
import { EhEnvDb } from '../../backend-types';

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
  return rows
    .map(({ envType, ...x }) => {
      const newVar: EhEnvDb = {
        ...x,
        appOverride: x.appOverride ?? undefined,
        ...(envType === 'prod' ? { envType: 'prod' } : {}),
      };
      return newVar;
    })
    .map(DbReaderMapper.ehEnv);
}
