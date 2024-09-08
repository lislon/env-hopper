import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { normalizeExternalAppName } from '../../lib/utils';

export type UserType = ReturnType<typeof userEvent.setup>;

export async function testWaitLoading() {
  await waitFor(() =>
    screen.getByRole('combobox', {
      name: /environment/i,
    }),
  );
}

export function testGetEnvComboBox() {
  return screen.getByRole<HTMLInputElement>('combobox', {
    name: /environment/i,
  });
}

export async function testToggleFavorite(user: UserType, title: string) {
  const favoriteButton = screen.getByRole('button', {
    name: new RegExp(`${title} .+? favorites`, 'i'),
  });
  await user.click(favoriteButton);
}

export async function testFillEnvAndApp(
  user: UserType,
  envName: string,
  appName: string,
) {
  await user.keyboard(envName);
  await user.keyboard('{Enter}{Tab}');
  await user.click(screen.getByRole('combobox', { name: /application/i }));
  await user.keyboard(appName);
  await user.keyboard('{Enter}{Tab}');
}

export async function testClickJumpAndReturnBtn(user: UserType) {
  const link = await waitFor(() => {
    screen.debug(document, 100000);
    return screen.getByRole<HTMLAnchorElement>('link', {
      name: /JUMP .+/,
    });
  });
  await user.click(link);
  return link;
}

export function expectHasHistory(envName: string, appName: string) {
  screen.getByRole('row', {
    name: envName + ' ' + normalizeExternalAppName(appName) + ' JUMP',
  });
}
