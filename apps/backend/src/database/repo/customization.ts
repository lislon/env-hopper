import prisma from '../prisma';
import { EhCustomization, EhCustomPartUnstable } from '@env-hopper/types';

export interface CustomizationUpdate {
  footerHtml?: string;
  analyticsScript?: string;
  custom?: Record<string, unknown>;
}

export interface CustomizationResult {
  footerHtml: string;
  analyticsScript: string;
}

export async function dbCustomizationUpdate({
  analyticsScript,
  footerHtml,
  custom,
}: CustomizationUpdate): Promise<void> {
  await prisma.unstableCustomization.upsert({
    create: {
      syntheticId: 1,
      unstable__footer_html: footerHtml || '',
      unstable__analytics_script: analyticsScript || '',
      unstable__custom: JSON.stringify(custom === undefined ? {} : custom),
    },
    update: {
      ...(analyticsScript !== undefined
        ? { unstable__analytics_script: analyticsScript }
        : {}),
      ...(footerHtml !== undefined
        ? { unstable__footer_html: footerHtml }
        : {}),
      ...(custom !== undefined
        ? { unstable__custom: JSON.stringify(custom) }
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
    let customFields = {};
    try {
      if (prismaUnstableCustomizationClient.unstable__custom !== '') {
        customFields = JSON.parse(
          prismaUnstableCustomizationClient.unstable__custom,
        ) as EhCustomPartUnstable;
      }
    } catch (e) {
      console.warn(
        'Failed to parse custom fields',
        prismaUnstableCustomizationClient.unstable__custom,
        e,
      );
    }
    return {
      analyticsScript:
        prismaUnstableCustomizationClient.unstable__analytics_script,
      footerHtml: prismaUnstableCustomizationClient.unstable__footer_html,
      ...customFields,
    };
  }
  return {
    analyticsScript: '',
    footerHtml: '',
  };
}
