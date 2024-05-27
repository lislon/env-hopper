import prisma from '../prisma';
import { Reader, Writer } from '../mappers';
import { EhApp } from '@env-hopper/types';

export async function dbAppsSet(dataRaw: EhApp[]): Promise<void> {
  await prisma.$transaction([
    prisma.application.deleteMany({}),
    prisma.application.createMany({ data: dataRaw.map(Writer.ehApp) })
  ]);
}

export async function dbAppsGet(): Promise<EhApp[]> {
  const rows = await prisma.application.findMany();
  return rows.map(Reader.ehApp);
}
