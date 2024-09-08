import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { apiGetConfig } from '../api/apiGetConfig';
import { userEvent } from '@testing-library/user-event';
import {
  expectHasHistory,
  testClickJumpAndReturnBtn,
  testFillEnvAndApp,
  testGetEnvComboBox,
  testToggleFavorite,
  testWaitLoading,
} from './__utils__/ui-toolbelt';
import {
  TestFeatureMagazine,
  TestFixtures,
  testMagazineMakeFixtures,
} from './__utils__/tests-magazine';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  localStorageMock,
  useLocalStorageMock,
} from './__utils__/useLocalStorageMock';
import {
  LOCAL_STORAGE_KEY_FAVORITE_APPS,
  LOCAL_STORAGE_KEY_FAVORITE_ENVS,
  LOCAL_STORAGE_KEY_RECENT_JUMPS,
} from '../context/EhContext';
import React from 'react';
import { getRoutes } from '../routes';
import { QueryClient } from '@tanstack/react-query';
import { apiGetCustomization } from '../api/apiGetCustomization';

vi.mock('../api/apiGetConfig');
vi.mock('../api/apiGetCustomization');
vi.mock('../hooks/useLocalStorage');

export interface GivenProps {
  testFixtures: TestFixtures;
}

async function given({ testFixtures }: GivenProps) {
  vi.mocked(apiGetConfig).mockResolvedValue({
    envs: testFixtures.envs || [],
    apps: testFixtures.apps || [],
    substitutions: testFixtures.substitutions || [],
    appVersion: 'test',
  });
  vi.mocked(apiGetCustomization).mockResolvedValue({
    footerHtml: '',
    analyticsScript: '',
  });

  vi.mocked(useLocalStorage).mockImplementation(useLocalStorageMock);

  if (testFixtures.favoriteApps) {
    localStorageMock[LOCAL_STORAGE_KEY_FAVORITE_APPS] =
      testFixtures.favoriteApps;
  }
  if (testFixtures.favoriteEnvs) {
    localStorageMock[LOCAL_STORAGE_KEY_FAVORITE_ENVS] =
      testFixtures.favoriteEnvs;
  }
  if (testFixtures.recentJumps) {
    localStorageMock[LOCAL_STORAGE_KEY_RECENT_JUMPS] = testFixtures.recentJumps;
  }

  const queryClient = new QueryClient();
  const router = createMemoryRouter(getRoutes(queryClient));
  render(<RouterProvider router={router} />);

  const setup = userEvent.setup();
  await testWaitLoading();
  return setup;
}

function getRecentSection() {
  return screen.getByRole('region', {
    name: /🕒 recent/i,
  });
}

function getFavoriteSection() {
  return screen.getByRole('region', {
    name: /⭐ Favorite/i,
  });
}

function getAllSection() {
  return screen.getByRole('region', {
    name: /🗂️ All/i,
  });
}

describe('Integration tests', () => {
  it('Basic scenario - user can navigate to URL by keyboard', async () => {
    const user = await given({
      testFixtures: testMagazineMakeFixtures(TestFeatureMagazine.userNoOptions),
    });

    await testFillEnvAndApp(user, '1', 'App1');
    const link = await testClickJumpAndReturnBtn(user);

    expect(link.href).toEqual('https://env1.mycompany.com:8250/login');
    expectHasHistory('env1', 'app1');
  });

  it('If user opens a autocomplete, but do not type anything, app will appear in every section', async () => {
    const user = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavoriteApp,
      ),
    });

    await user.click(testGetEnvComboBox());
    within(getRecentSection()).getByRole('option', {
      name: /env1/,
    });

    within(getFavoriteSection()).getByRole('option', {
      name: /env1/,
    });

    within(getAllSection()).getByRole('option', {
      name: /env1/,
    });
  });

  it('Recent env are suggested', async () => {
    const user = await given({
      testFixtures: testMagazineMakeFixtures(TestFeatureMagazine.userNoOptions),
    });

    await testFillEnvAndApp(user, '1', 'App1');
    await testClickJumpAndReturnBtn(user);
    await user.click(testGetEnvComboBox());

    within(getRecentSection()).getByRole('option', {
      name: /env1/,
    });
  });

  it('If toggle favorite recent env, the star icon will be added and selection stays in the recent section', async () => {
    const user = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentJumps,
      ),
    });

    await user.click(testGetEnvComboBox());

    await user.keyboard('1');
    await testToggleFavorite(user, 'env1');
    within(getRecentSection()).getByRole('button', {
      name: /Remove/i,
    });
  });

  it('favorite env has stars in all sections', async () => {
    const user = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavoriteApp,
      ),
    });

    await user.click(testGetEnvComboBox());

    within(getRecentSection()).getByRole('button', {
      name: /Remove/i,
    });

    within(getFavoriteSection()).getByRole('button', {
      name: /Remove/i,
    });

    within(getAllSection()).getByRole('button', {
      name: /Remove/i,
    });
  });

  it('When there is already preselected env and user clicks on it, text will be select-ed and all options will be shown', async () => {
    const user = await given({
      testFixtures: testMagazineMakeFixtures(TestFeatureMagazine.userNoOptions),
    });
    await testFillEnvAndApp(user, '1', 'App1');
    const envComboBox = testGetEnvComboBox();
    await user.click(envComboBox);

    expect(getAllSection()).toBeTruthy();
    expect([envComboBox.selectionStart, envComboBox.selectionEnd]).toEqual([
      0,
      envComboBox.value.length,
    ]);
  });

  it('additional substitutions in URL works', async () => {
    const user = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavoriteApp,
      ),
    });
    await testFillEnvAndApp(user, '1', 'App3');

    const substitutionValue = screen.getByRole('textbox', {
      name: /Namespace/i,
    });
    await user.type(substitutionValue, 'my-namespace');

    const link = screen.getByRole<HTMLAnchorElement>('link', {
      name: /JUMP .+/,
    });
    expect(link.href).toEqual('https://env1.mycompany.com:8250/my-namespace');
  });
});
