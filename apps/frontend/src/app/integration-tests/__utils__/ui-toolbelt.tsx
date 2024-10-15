import { screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { getAppIdByTitle } from '../../lib/utils';
import { ComboBoxType, FavoriteOrRecent } from '../../types';
import { expect } from 'vitest';

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

export function testGetAppComboBox() {
  return screen.getByRole<HTMLInputElement>('combobox', {
    name: /application/i,
  });
}

export async function testUserSelectApp(user: UserType, appName: string) {
  const combo = testGetAppComboBox();
  await user.click(combo);
  await user.keyboard(appName);
  await user.keyboard('{Enter}{Tab}');
}

export async function testUserSelectEnv(user: UserType, envName: string) {
  const combo = testGetEnvComboBox();
  await user.click(combo);
  await user.keyboard(envName);
  await user.keyboard('{Enter}{Tab}');
}

function testGetHomeFavoriteButton(type: ComboBoxType): HTMLElement {
  const appSelectionForm = screen.getByRole('heading', {
    name: type === 'applications' ? /^Application$/ : /^Environment$/,
  });

  const comboBoxOuterElement =
    appSelectionForm?.parentElement?.parentElement?.parentElement
      ?.parentElement;
  if (!comboBoxOuterElement) {
    throw new Error('Should not happen parentElement is null');
  }
  return within(comboBoxOuterElement).getByRole('button');
}

export async function testUserToggleHomeFavorite(
  user: UserType,
  type: ComboBoxType,
) {
  const favoriteButton = testGetHomeFavoriteButton(type);
  await user.click(favoriteButton);
}

function getTitleQuickBar(type: ComboBoxType, favOrRecent: FavoriteOrRecent) {
  return `List of your ${favOrRecent === 'favorite' ? 'favorite' : 'recent'} ${type === 'environments' ? 'environments' : 'applications'}`;
}

export function testIsQuickBarVisible(
  type: ComboBoxType,
  favOrRecent: FavoriteOrRecent,
): boolean {
  const favorite = screen.queryByTitle(getTitleQuickBar(type, favOrRecent));

  return favorite !== null;
}

export function testListQuickBarOptions(
  type: ComboBoxType,
  favOrRecent: FavoriteOrRecent,
): string[] {
  const favoriteBar = screen.getByTestId(`quick-bar-${type}-${favOrRecent}`);
  const findAllByRole: HTMLAnchorElement[] =
    within(favoriteBar).queryAllByRole<HTMLAnchorElement>('link');
  return [...findAllByRole]
    .map((btn) => btn.textContent)
    .filter((b) => b !== null);
}

export async function testToggleFavorite(user: UserType, title: string) {
  const favoriteButton = screen.getByRole('button', {
    name: new RegExp(`${title} .+? favorites`, 'i'),
  });
  await user.click(favoriteButton);
}

export async function testFillEnvAndAppKeyboardOnly(
  user: UserType,
  envName: string,
  appName: string,
) {
  await user.keyboard(envName);
  await user.keyboard('{Enter}');
  await user.tab();
  await user.keyboard('{Space}');

  // await user.tab();
  // await user.keyboard(appName);
  // await user.keyboard('{Enter}');
}
export async function testFillEnv(user: UserType, envName: string) {
  await user.click(testGetEnvComboBox());
  await user.keyboard(envName);
  await user.keyboard('{Enter}');
}

export async function testFillApp(user: UserType, appName: string) {
  await user.click(testGetAppComboBox());
  await user.keyboard(appName);
  await user.keyboard('{Enter}');
}

export async function testFillEnvAndApp(
  user: UserType,
  envName: string,
  appName: string,
) {
  await testFillEnv(user, envName);
  await testFillApp(user, appName);
}

export async function testGetJumpButton(): Promise<HTMLLinkElement> {
  const link = await waitFor(() => {
    const jumpButtons = screen.getAllByText(/^jump$/i);
    const realJumpButton = jumpButtons.find(
      (b) => !b.className.includes('tooltip'),
    );
    if (realJumpButton) {
      expect(realJumpButton.parentElement?.tagName).toBe('A');
      return realJumpButton.parentElement as HTMLLinkElement;
    }
    throw new Error('Jump button not found');
  });
  return link;
}

export async function testClickJumpAndReturnBtn(user: UserType) {
  const link = await testGetJumpButton();
  await user.click(link);
  return link;
}

export function expectHasHistory(envName: string, appName: string) {
  screen.getByRole('row', {
    name: envName + ' ' + getAppIdByTitle(appName) + ' JUMP',
  });
}

export function getOpenedAutocompleteListBox() {
  const allByRole = screen.getAllByRole('listbox');
  const openedAutocomplete = allByRole.filter(
    (l) => !l.className.includes('invisible'),
  );
  if (openedAutocomplete.length !== 1) {
    throw new Error(
      `Expected one autocomplete to be opened, but got ${openedAutocomplete.length}`,
    );
  }
  return openedAutocomplete[0];
}

export interface ExpandedAutocompleteState {
  recentSection: string[];
  favoriteSection: string[];
  allSection: string[];
}
