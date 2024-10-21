import { screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { getAppIdByTitle } from '../../lib/utils';
import { ComboBoxType, FavoriteOrRecent } from '../../types';
import { EhAppId } from '@env-hopper/types';

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

export function testGetSubstitutionInput() {
  return screen.getByTestId<HTMLInputElement>('substitution-input');
}

export async function testUserTypeSubstitution(
  user: UserType,
  substitution: string,
) {
  const combo = testGetSubstitutionInput();
  await user.click(combo);
  await user.keyboard(substitution);
}

export async function testUserSelectApp(user: UserType, appName: string) {
  const combo = testGetAppComboBox();
  await user.click(combo);
  await user.keyboard(appName);
  await user.keyboard('{Enter}');
}

export async function testUserSelectEnv(user: UserType, envName: string) {
  const combo = testGetEnvComboBox();
  await user.click(combo);
  await user.keyboard(envName);
  await user.keyboard('{Enter}');
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

export async function testQuickBarClick(
  user: UserType,
  type: ComboBoxType,
  favOrRecent: FavoriteOrRecent,
  envName: string,
) {
  const quickBar = testGetQuickBar(type, favOrRecent);
  const envButton = within(quickBar).getByText(envName);
  await user.click(envButton);
}

function testGetQuickBar(type: ComboBoxType, favOrRecent: FavoriteOrRecent) {
  return screen.getByTestId(`quick-bar-${type}-${favOrRecent}`);
}

export function testListQuickBarOptions(
  type: ComboBoxType,
  favOrRecent: FavoriteOrRecent,
): string[] {
  const quickBar = testGetQuickBar(type, favOrRecent);
  const findAllByRole: HTMLAnchorElement[] =
    within(quickBar).queryAllByRole<HTMLAnchorElement>('link');
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

export async function testGetJumpButtonText(): Promise<HTMLElement> {
  return screen.getByTestId<HTMLElement>('jump-main-button-text');
}

export async function testGetJumpButtonLink(): Promise<HTMLLinkElement> {
  return screen.getByTestId<HTMLLinkElement>('jump-main-button');
}

export async function testClickJumpBtn(user: UserType) {
  const link = await testGetJumpButtonLink();
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

export function normalizeAppId(app: EhAppId): EhAppId {
  return app.includes('/') ? app : `${app}/home`;
}
