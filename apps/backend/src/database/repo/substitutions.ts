import { EhSubstitutionDb } from '../../backend-types';
import prisma from '../prisma';
import { Reader, Writer } from '../mappers';

export async function dbSubstitutionsSet(
  data: EhSubstitutionDb[]
): Promise<void> {
  await prisma.$transaction([
    prisma.substitution.deleteMany({}),
    prisma.substitution.createMany({ data: data.map(Writer.ehSubstitution) }),
  ]);
}

export async function dbSubstitutionsGet(): Promise<EhSubstitutionDb[]> {
  return (await prisma.substitution.findMany()).map(Reader.ehSubstitution);
}
