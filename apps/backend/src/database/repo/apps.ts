import prisma from '../prisma';
import { DbReaderMapper, DbWriterMapper } from '../mappers';
import { EhAppBackend } from '../../backend-types';

export async function dbAppsSet(dataRaw: EhAppBackend[]): Promise<void> {
  await prisma.$transaction([
    prisma.application.deleteMany({}),
    prisma.application.createMany({ data: dataRaw.map(DbWriterMapper.ehApp) }),
  ]);
}

export async function dbAppsGet(): Promise<EhAppBackend[]> {
  const rows = await prisma.application.findMany({
    orderBy: [
      {
        id: 'asc',
      },
    ],
  });
  return rows.map(DbReaderMapper.ehApp);
}
