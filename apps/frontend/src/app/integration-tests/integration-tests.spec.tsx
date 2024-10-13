import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import type { Router as RemixRouter } from '@remix-run/router';

import { describe, expect, it, vi } from 'vitest';
import { apiGetConfig } from '../api/apiGetConfig';
import { userEvent } from '@testing-library/user-event';
import {
  ExpandedAutocompleteState,
  expectHasHistory,
  getOpenedAutocompleteListBox,
  testClickJumpAndReturnBtn,
  testFillEnv,
  testFillEnvAndApp,
  testFillEnvAndAppKeyboardOnly,
  testGetAppComboBox,
  testGetEnvComboBox,
  testGetJumpButton,
  testIsQuickBarVisible,
  testListQuickBarOptions,
  testUserSelectApp,
  testUserSelectEnv,
  testUserToggleHomeFavorite,
  testWaitLoading,
} from './__utils__/ui-toolbelt';
import {
  TestFeatureMagazine,
  TestFixtures,
  testMagazineMakeFixtures,
  testMakeEnv,
} from './__utils__/tests-magazine';
import {
  LOCAL_STORAGE_KEY_FAVORITE_APPS,
  LOCAL_STORAGE_KEY_FAVORITE_ENVS,
  LOCAL_STORAGE_KEY_RECENT_JUMPS,
} from '../context/EhContext';
import React from 'react';
import { getRoutes } from '../routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiGetCustomization } from '../api/apiGetCustomization';

vi.mock('../api/apiGetConfig');
vi.mock('../api/apiGetCustomization');

export interface GivenProps {
  url?: string;
  testFixtures: TestFixtures;
}

export type UserType = ReturnType<typeof userEvent.setup>;

export interface GivenReturn {
  user: UserType;
  router: RemixRouter;
}

async function given({ url, testFixtures }: GivenProps): Promise<GivenReturn> {
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

  if (testFixtures.favoriteApps) {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_FAVORITE_APPS,
      JSON.stringify(testFixtures.favoriteApps),
    );
  }
  if (testFixtures.favoriteEnvs) {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_FAVORITE_ENVS,
      JSON.stringify(testFixtures.favoriteEnvs),
    );
  }
  if (testFixtures.recentJumps) {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_RECENT_JUMPS,
      JSON.stringify(testFixtures.recentJumps),
    );
  }

  const queryClient = new QueryClient();
  const router = createMemoryRouter(getRoutes(queryClient), {
    initialEntries: url ? [url] : undefined,
  });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  const user = userEvent.setup();
  await testWaitLoading();
  return { user, router };
}

function getLogicalAutocompleteOptions(): ExpandedAutocompleteState {
  const openedAutocompleteElement = getOpenedAutocompleteListBox();
  const listItems = within(openedAutocompleteElement).getAllByText(/.+/i);

  const output: ExpandedAutocompleteState = {
    recentSection: [],
    favoriteSection: [],
    allSection: [],
  };
  let currentSection: keyof ExpandedAutocompleteState = 'allSection';

  const recentSection = '🕒 Recent';
  const favoriteSection = '⭐ Favorite';
  const allSection = '🗂️ All';
  for (const item of listItems) {
    const innerHTML = item.innerHTML;
    if (innerHTML.includes(recentSection)) {
      currentSection = 'recentSection';
    } else if (innerHTML.includes(favoriteSection)) {
      currentSection = 'favoriteSection';
    } else if (innerHTML.includes(allSection)) {
      currentSection = 'allSection';
    } else {
      output[currentSection].push(innerHTML);
    }
  }

  return output;
}

async function givenUserNavigatedTwoAppAndEnvs(
  user: UserType,
  navigations: string[],
) {
  for (const nav of navigations) {
    const [env, app] = nav.split(/-/);
    await testFillEnvAndApp(user, env, app);
    await testClickJumpAndReturnBtn(user);
  }
}

function testGetComboboxInputEnvironment() {
  return screen.getByRole<HTMLInputElement>('combobox', {
    name: /environment/i,
  });
}

describe('Integration tests', () => {
  // jestdom issue with focus change on tab
  it.skip('Basic scenario - user can navigate to URL by keyboard - first time user', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(TestFeatureMagazine.firstTimeUser),
    });

    // expect(screen.getByRole('textbox', { name: /environment/i })).havF
    await testFillEnvAndAppKeyboardOnly(user, '1', 'App1');
    const link = await testClickJumpAndReturnBtn(user);

    expect(link.href).toEqual('https://env1.mycompany.com:8250/app1/login');
    expectHasHistory('env1', 'app1');
  });

  // with daisy
  it('If user opens a autocomplete, but do not type anything, app will appear in every section', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavorites,
      ),
    });

    await user.click(testGetEnvComboBox());
    const autocomplete = getLogicalAutocompleteOptions();
    expect(autocomplete.recentSection).toContain('env1');
    expect(autocomplete.favoriteSection).toContain('env1');
    expect(autocomplete.allSection).toContain('env1');
  });

  it('Recent env are suggested', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(TestFeatureMagazine.userNoOptions),
    });

    await testFillEnvAndApp(user, '1', 'App1');
    await testClickJumpAndReturnBtn(user);
    await user.click(testGetEnvComboBox());

    expect(getLogicalAutocompleteOptions().recentSection).toContain('env1');
  });

  it('When there is already preselected env and user clicks on it, text will be select-ed and all options will be shown', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(TestFeatureMagazine.userNoOptions),
    });
    await testFillEnvAndApp(user, '1', 'App1');
    const envComboBox = testGetEnvComboBox();
    await user.click(envComboBox);

    expect([envComboBox.selectionStart, envComboBox.selectionEnd]).toEqual([
      0,
      envComboBox.value.length,
    ]);
  });

  it('additional substitutions in URL works', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavorites,
      ),
    });
    await testFillEnvAndApp(user, '1', 'App3');

    const substitutionValue = screen.getByRole('textbox', {
      name: /Namespace/i,
    });
    await user.type(substitutionValue, 'my-namespace');

    const link = await testGetJumpButton();
    expect(link.href).toEqual('https://env1.mycompany.com:8250/my-namespace');
  });

  it('Can use enter to select first suggestion', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavorites,
      ),
    });

    await user.keyboard('env');
    await user.keyboard('{Enter}');
    const byRole = testGetComboboxInputEnvironment();
    expect(byRole.value).toEqual('env1');
  });

  // migrate to tanstack router
  it.skip('Can remove selection', async () => {
    const { user, router } = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavorites,
      ),
    });
    await testFillEnv(user, 'env1');
    expect(router.state.location.pathname).toEqual('/env/env1');
    await user.click(testGetEnvComboBox());
    await user.keyboard('{Backspace}{Esc}');
    await user.click(testGetAppComboBox());

    expect(router.state.location.pathname).toEqual('/');
  });

  it('Can navigate use arrow keys', async () => {
    const { user } = await given({
      url: '/env/env1',
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavorites,
      ),
    });

    await user.keyboard('app');
    await user.keyboard('[ArrowDown]');
    await user.keyboard('[ArrowDown]');
    await user.keyboard('{Enter}');
    const byRole = screen.getByRole<HTMLInputElement>('combobox', {
      name: /application/i,
    });
    expect(byRole.value).toEqual('app2');
  });

  describe('Tests jumps', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('Can use double enter to jump to specific env or app', async () => {
      const spyChangeUrl = vi.spyOn(global, 'open');
      spyChangeUrl.mockReturnValue(null);

      const { user } = await given({
        url: '/env/env1',
        testFixtures: testMagazineMakeFixtures(
          TestFeatureMagazine.hasRecentAndFavorites,
        ),
      });

      await user.keyboard('app');
      await user.keyboard('{Enter}');
      await user.keyboard('{Enter}');
      expect(spyChangeUrl.mock.calls[0][0]).toContain('env1');
    });
  });

  describe('QuickBar', () => {
    it('User can add favorite app using home page', async () => {
      const { user } = await given({
        testFixtures: testMagazineMakeFixtures(
          TestFeatureMagazine.firstTimeUser,
        ),
      });

      await testUserSelectApp(user, 'app1');
      await testUserToggleHomeFavorite(user, 'applications');
      const favoriteApps = testListQuickBarOptions('applications', 'favorite');
      expect(favoriteApps).toStrictEqual(['app1']);
    });

    it('User can add favorite env using home page', async () => {
      const { user } = await given({
        testFixtures: testMagazineMakeFixtures(
          TestFeatureMagazine.firstTimeUser,
        ),
      });

      await testUserSelectEnv(user, 'env1');
      await testUserToggleHomeFavorite(user, 'environments');
      const favoriteApps = testListQuickBarOptions('environments', 'favorite');
      expect(favoriteApps).toStrictEqual(['env1']);
    });

    it('User can remove favorite app using home page', async () => {
      const { user } = await given({
        testFixtures: testMagazineMakeFixtures(
          TestFeatureMagazine.hasRecentAndFavorites,
        ),
      });

      await testUserSelectApp(user, 'app1');
      await testUserToggleHomeFavorite(user, 'applications');
      expect(testIsQuickBarVisible('applications', 'favorite')).toBeFalsy();
    });

    it('Favorites will be added to the start of the list', async () => {
      const { user } = await given({
        testFixtures: testMagazineMakeFixtures(
          TestFeatureMagazine.hasRecentAndFavorites,
        ),
      });

      await testUserSelectApp(user, 'app2');
      await testUserToggleHomeFavorite(user, 'applications');
      const list = testListQuickBarOptions('applications', 'favorite');
      expect(list).toEqual(['app2', 'app1']);
    });

    it('User will see recent envs will be added to the beginning of quick bar access', async () => {
      const { user } = await given({
        testFixtures: testMagazineMakeFixtures(
          TestFeatureMagazine.firstTimeUser,
        ),
      });

      await givenUserNavigatedTwoAppAndEnvs(user, ['env1-app1', 'env2-app2']);

      const recent = testListQuickBarOptions('environments', 'recent');
      expect(recent).toStrictEqual(['env2', 'env1']);
    });

    it('User will see recent apps will be added to the beginning of quick bar access', async () => {
      const { user } = await given({
        testFixtures: testMagazineMakeFixtures(
          TestFeatureMagazine.firstTimeUser,
        ),
      });
      await givenUserNavigatedTwoAppAndEnvs(user, ['env1-app1', 'env2-app2']);

      const recent = testListQuickBarOptions('applications', 'recent');
      expect(recent).toStrictEqual(['app2', 'app1']);
    });

    it('show no duplicate in recent apps quick access', async () => {
      const { user } = await given({
        testFixtures: testMagazineMakeFixtures(
          TestFeatureMagazine.firstTimeUser,
        ),
      });
      await givenUserNavigatedTwoAppAndEnvs(
        user,
        ['app1', 'app2', 'app1'].map((app) => `env1-${app}`),
      );

      const recent = testListQuickBarOptions('applications', 'recent');
      expect(recent).toStrictEqual(['app1', 'app2']);
    });

    it('show no duplicate in recent envs quick access', async () => {
      const { user } = await given({
        testFixtures: testMagazineMakeFixtures(
          TestFeatureMagazine.firstTimeUser,
        ),
      });
      await givenUserNavigatedTwoAppAndEnvs(
        user,
        ['env1', 'env2', 'env1'].map((env) => `${env}-app1`),
      );

      const recent = testListQuickBarOptions('environments', 'recent');
      expect(recent).toStrictEqual(['env1', 'env2']);
    });

    it('older recent env will be outplaced by new ones', async () => {
      const envNames = ['env1', 'env2', 'env3', 'env4', 'env5', 'env6'];

      const { user } = await given({
        testFixtures: testMagazineMakeFixtures({
          isInitialState: false,
          existingEnvs: envNames.map(testMakeEnv),
        }),
      });
      await givenUserNavigatedTwoAppAndEnvs(
        user,
        envNames.map((env) => `${env}-app1`),
      );

      const recent = testListQuickBarOptions('environments', 'recent');
      expect(recent).toEqual(['env6', 'env5', 'env4', 'env3', 'env2']);
    });
  });
});
