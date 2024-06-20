import prisma from '../prisma';
import { Reader, Writer } from '../mappers';
import { EhEnv } from '@env-hopper/types';

export async function dbEnvsSet(data: EhEnv[]): Promise<void> {
  await prisma.$transaction([
    prisma.environment.deleteMany({}),
    prisma.environment.createMany({ data: data.map(Writer.ehEnv) }),
  ]);
}

export async function dbEnvsGet(): Promise<EhEnv[]> {
  const rows = await prisma.environment.findMany({orderBy: [{
      name: 'asc',
    }]});
  return rows.map(Reader.ehEnv);
}
