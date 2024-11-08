import prisma from '../prisma';
import {
  AppLinkType,
  EhCustomization,
  EhCustomPartUnstable,
  EhIcon,
} from '@env-hopper/types';

export interface CustomizationUpdate {
  footerHtml?: string;
  analyticsScript?: string;
  icons?: EhIcon[];
  custom?: Record<string, unknown>;
  appLinkTypes?: AppLinkType[];
}

export async function dbCustomizationUpdate({
  analyticsScript,
  footerHtml,
  custom,
  icons,
  appLinkTypes,
}: CustomizationUpdate): Promise<void> {
  await prisma.unstableCustomization.upsert({
    create: {
      syntheticId: 1,
      unstable__footer_html: footerHtml || '',
      unstable__analytics_script: analyticsScript || '',
      unstable__custom: JSON.stringify(custom === undefined ? {} : custom),
      unstable__icons: JSON.stringify(icons === undefined ? [] : icons),
      unstable__appLinkTypes: JSON.stringify(
        appLinkTypes === undefined ? [] : icons,
      ),
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
      ...(icons !== undefined
        ? { unstable__icons: JSON.stringify(icons) }
        : {}),
      ...(appLinkTypes !== undefined
        ? { unstable__appLinkTypes: JSON.stringify(appLinkTypes) }
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
    let icons: EhCustomization['icons'] = [];
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
    try {
      if (prismaUnstableCustomizationClient.unstable__icons !== '') {
        icons = JSON.parse(
          prismaUnstableCustomizationClient.unstable__icons,
        ) as EhCustomization['icons'];
      }
    } catch (e) {
      console.warn(
        'Failed to parse icons',
        prismaUnstableCustomizationClient.unstable__icons,
        e,
      );
    }

    let appLinkTypes: EhCustomization['appLinkTypes'] = [];
    try {
      if (prismaUnstableCustomizationClient.unstable__appLinkTypes !== '') {
        appLinkTypes = JSON.parse(
          prismaUnstableCustomizationClient.unstable__appLinkTypes,
        ) as EhCustomization['appLinkTypes'];
      }
    } catch (e) {
      console.warn(
        'Failed to parse icons',
        prismaUnstableCustomizationClient.unstable__appLinkTypes,
        e,
      );
    }

    return {
      analyticsScript:
        prismaUnstableCustomizationClient.unstable__analytics_script,
      footerHtml: prismaUnstableCustomizationClient.unstable__footer_html,
      icons,
      appLinkTypes,
      ...customFields,
    };
  }
  return {
    analyticsScript: '',
    footerHtml: '',
    icons: [],
    appLinkTypes: [],
  };
}
