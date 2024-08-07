import prisma from '../prisma';

export async function dbCustomHtmlSet(html: string): Promise<void> {
  await prisma.$transaction([
    prisma.customFooterHtml.deleteMany(),
    prisma.customFooterHtml.create({ data: { html: html } }),
  ]);
}

export async function dbCustomHtmlGet(): Promise<string | undefined> {
  const row = await prisma.customFooterHtml.findFirst({});
  return row?.html || undefined;
}
