import { EhSubstitutionDb } from '../../backend-types';
import prisma from '../prisma';
import { DbReaderMapper, DbWriterMapper } from '../mappers';

export async function dbSubstitutionsSet(
  data: EhSubstitutionDb[]
): Promise<void> {
  await prisma.$transaction([
    prisma.substitution.deleteMany(),
    prisma.substitution.createMany({ data: data.map(DbWriterMapper.ehSubstitution) }),
  ]);
}

export async function dbSubstitutionsGet(): Promise<EhSubstitutionDb[]> {
  return (
    await prisma.substitution.findMany({
      orderBy: [
        {
          id: 'asc',
        },
      ],
    })
  ).map(DbReaderMapper.ehSubstitution);
}
