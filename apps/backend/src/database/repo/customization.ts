import prisma from '../prisma';
import { EhCustomization } from '@env-hopper/types';

export interface CustomizationUpdate {
  footerHtml?: string;
  analyticsScript?: string;
}

export interface CustomizationResult {
  footerHtml: string;
  analyticsScript: string;
}

export async function dbCustomizationUpdate({
  analyticsScript,
  footerHtml,
}: CustomizationUpdate): Promise<void> {
  await prisma.unstableCustomization.upsert({
    create: {
      syntheticId: 1,
      unstable__footer_html: footerHtml || '',
      unstable__analytics_html: analyticsScript || '',
    },
    update: {
      ...(analyticsScript !== undefined
        ? { unstable__analytics_html: analyticsScript }
        : {}),
      ...(footerHtml !== undefined
        ? { unstable__footer_html: footerHtml }
        : {}),
    },
    where: {
      syntheticId: 1,
    },
  });
}

export async function dbCustomizationGet(): Promise<EhCustomization> {
  const prismaUnstableCustomizationClient =
    await prisma.unstableCustomization.findFirst({});
  if (prismaUnstableCustomizationClient) {
    return {
      analyticsScript:
        prismaUnstableCustomizationClient.unstable__analytics_html,
      footerHtml: prismaUnstableCustomizationClient.unstable__footer_html,
    };
  }
  return {
    analyticsScript: '',
    footerHtml: '',
  };
}
