import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import type { Router as RemixRouter } from '@remix-run/router';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGetConfig } from '../api/apiGetConfig';
import { userEvent } from '@testing-library/user-event';
import {
  ExpandedAutocompleteState,
  getOpenedAutocompleteListBox,
  normalizeAppId,
  testClickJumpBtn,
  testFillEnv,
  testFillEnvAndApp,
  testGetAppComboBox,
  testGetEnvComboBox,
  testGetJumpButtonLink,
  testGetJumpButtonText,
  testGetSubstitutionInput,
  testIsQuickBarVisible,
  testListQuickBarOptions,
  testQuickBarClick,
  testUserSelectApp,
  testUserSelectEnv,
  testUserToggleHomeFavorite,
  testUserTypeSubstitution,
  testWaitLoading,
} from './__utils__/ui-toolbelt';
import {
  TestFeatureMagazine,
  TestFixtures,
  testMagazineMakeFixtures,
  testMakeApp,
  testMakeEnv,
  testMakeLastUsedApp,
  testMakeLastUsedEnv,
  testMakeRecentJump,
} from './__utils__/tests-magazine';
import {
  LOCAL_STORAGE_KEY_FAVORITE_APPS,
  LOCAL_STORAGE_KEY_FAVORITE_ENVS,
  LOCAL_STORAGE_KEY_LAST_USED_APP,
  LOCAL_STORAGE_KEY_LAST_USED_ENV,
  LOCAL_STORAGE_KEY_LAST_USED_SUBS,
  LOCAL_STORAGE_KEY_RECENT_JUMPS,
} from '../context/EhContext';
import React from 'react';
import { getRoutes } from '../routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiGetCustomization } from '../api/apiGetCustomization';
import { EhServerSyncContextProvider } from '../context/EhServerSyncContext';

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
  const config = {
    envs: testFixtures.envs || [],
    apps: testFixtures.apps || [],
    substitutions: testFixtures.substitutions || [],
    appVersion: 'test',
  };
  vi.mocked(apiGetConfig).mockResolvedValue(config);
  vi.mocked(apiGetCustomization).mockResolvedValue({
    footerHtml: '',
    analyticsScript: '',
  });
  localStorage.clear();
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

  if (testFixtures.lastApp) {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_LAST_USED_APP,
      JSON.stringify(normalizeAppId(testFixtures.lastApp)),
    );
  }
  if (testFixtures.lastEnv) {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_LAST_USED_ENV,
      JSON.stringify(testFixtures.lastEnv),
    );
  }

  if (testFixtures.lastSubs) {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_LAST_USED_SUBS,
      JSON.stringify(testFixtures.lastSubs),
    );
  }

  const queryClient = new QueryClient();
  const router = createMemoryRouter(getRoutes(), {
    initialEntries: url ? [url] : undefined,
  });
  render(
    <QueryClientProvider client={queryClient}>
      <EhServerSyncContextProvider config={config} error={null}>
        <RouterProvider router={router} />
      </EhServerSyncContextProvider>
    </QueryClientProvider>,
  );

  const user = userEvent.setup();
  await testWaitLoading();
  return { user, router };
}

type SectionType = keyof ExpandedAutocompleteState;

function getLogicalAutocompleteOptions(): ExpandedAutocompleteState {
  const openedAutocompleteElement = getOpenedAutocompleteListBox();
  const listItems = within(openedAutocompleteElement).getAllByText(/.+/i);

  const output: ExpandedAutocompleteState = {
    recentSection: [],
    favoriteSection: [],
    sameSubSection: [],
    allSection: [],
  };
  let currentSection: SectionType = 'allSection';

  const keys = Object.keys(output) as unknown as SectionType[];
  for (const item of listItems) {
    const sectionType = item.getAttribute('data-testid') as SectionType | null;
    if (sectionType !== null && keys.includes(sectionType)) {
      currentSection = sectionType;
    } else {
      output[currentSection].push(item.innerHTML);
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
    await testClickJumpBtn(user);
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
    // const { user } = await given({
    //   testFixtures: testMagazineMakeFixtures(TestFeatureMagazine.firstTimeUser)
    // });
    // expect(screen.getByRole('textbox', { name: /environment/i })).havF
    // await testFillEnvAndAppKeyboardOnly(user, '1', 'App1');
    // const link = await testClickJumpAndReturnBtn(user);
    // expect(link.href).toEqual('https://env1.mycompany.com:8250/app1/login');
    // expectHasHistory('env1', 'app1');
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
    await testClickJumpBtn(user);
    await user.click(testGetEnvComboBox());

    expect(getLogicalAutocompleteOptions().recentSection).toContain('env1');
  });

  it('Recent app are suggested', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(TestFeatureMagazine.userNoOptions),
    });

    await testFillEnvAndApp(user, '1', 'App1');
    await testClickJumpBtn(user);
    await user.click(testGetAppComboBox());

    expect(getLogicalAutocompleteOptions().recentSection).toContain('app1');
  });

  it('Same substitution are suggested', async () => {
    const { user } = await given({
      testFixtures: {
        ...testMagazineMakeFixtures(TestFeatureMagazine.userNoOptions),
        apps: [
          testMakeApp('appA', { substitution: 'namespace' }),
          testMakeApp('appB', { substitution: 'namespace' }),
        ],
        lastApp: testMakeLastUsedApp('appA'),
        lastEnv: testMakeLastUsedEnv('env1'),
        lastSubs: { namespace: 'namespace1' },
      },
    });

    await user.click(testGetAppComboBox());
    expect(getLogicalAutocompleteOptions().sameSubSection).toEqual([
      'appA',
      'appB',
    ]);
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

  it('Additional substitutions in URL works', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavorites,
      ),
    });
    await testFillEnvAndApp(user, '1', 'app3-sub');

    const substitutionValue = screen.getByRole('textbox', {
      name: /Namespace/i,
    });
    await user.type(substitutionValue, 'my-namespace');

    const link = await testGetJumpButtonLink();
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
    screen.debug();
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

  it('after quick selection of app with substitution, should move focus to it and preselect text', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavorites,
      ),
    });
    await testUserSelectEnv(user, 'env1');
    await testUserSelectApp(user, 'app3-sub');
    const substitution = screen.getByRole('textbox', { name: /Namespace/i });
    expect(document.activeElement).toEqual(substitution);
  });

  it('should focus substitution text on quick link focus', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavorites,
      ),
    });
    await testUserSelectEnv(user, 'env1');
    await testUserSelectApp(user, 'app3-sub');
    await testUserTypeSubstitution(user, 'namespace1');
    await testClickJumpBtn(user);
    await testUserSelectApp(user, 'app1');
    await testQuickBarClick(user, 'applications', 'recent', 'app3-sub');

    const substitution = testGetSubstitutionInput();
    expect(document.activeElement).toEqual(substitution);
    expect(substitution.value).toBe('namespace1');
    expect(substitution.selectionEnd).toBeGreaterThan(0);
  });

  it('should show hint on how substitution works', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavorites,
      ),
    });
    await testUserSelectEnv(user, 'env1');
    await testUserSelectApp(user, 'app3-sub');

    const substitution = await testGetJumpButtonText();
    expect(substitution.children[0].tagName).toBe('PRE');
    expect(substitution.children[0].innerHTML.split('\n'))
      .toMatchInlineSnapshot(`
      [
        "https://env1.mycompany.com:8250/{{namespace}}",
        "                                  ^^^^^^^^^  ",
        "",
        "Select Namespace",
      ]
    `);
  });

  // router issue
  it.skip('should deselect environment when user clicks on recent item', async () => {
    const { user } = await given({
      testFixtures: testMagazineMakeFixtures(
        TestFeatureMagazine.hasRecentAndFavorites,
      ),
    });
    expect(testGetEnvComboBox().value).toBe('');
    await testQuickBarClick(user, 'environments', 'recent', 'env1');
    expect(testGetEnvComboBox().value).toBe('env1');
    await testQuickBarClick(user, 'environments', 'recent', 'env1');
    expect(testGetEnvComboBox().value).toBe('');
  });

  it('should prepopulate last used values', async () => {
    await given({
      testFixtures: {
        ...testMagazineMakeFixtures(TestFeatureMagazine.firstTimeUser),
        lastEnv: 'env1',
        lastApp: 'app3-sub',
        lastSubs: { namespace: 'namespace1' },
      },
    });
    expect(testGetEnvComboBox().value).toBe('env1');
    expect(testGetAppComboBox().value).toBe('app3-sub');
    expect(testGetSubstitutionInput().value).toBe('namespace1');
  });

  describe('should not reuse wrong substitution when user select type of app', () => {
    let user: UserType;
    beforeEach(async () => {
      const ret = await given({
        testFixtures: {
          ...testMagazineMakeFixtures(TestFeatureMagazine.firstTimeUser),
          apps: [
            testMakeApp('appA', { substitution: 'namespace' }),
            testMakeApp('appB', { substitution: 'orderId' }),
          ],
          recentJumps: [
            testMakeRecentJump('env1', 'appA', 'namespace1'),
            testMakeRecentJump('env2', 'appB', 'order1'),
          ],
          lastApp: testMakeLastUsedApp('appA'),
          lastEnv: testMakeLastUsedEnv('env1'),
          lastSubs: { namespace: 'namespace1' },
        },
      });
      user = ret.user;
    });

    it('should work in quickbar', async () => {
      await testQuickBarClick(user, 'applications', 'recent', 'appB');
      expect(testGetSubstitutionInput().value).toBe('');
    });

    it('should work in app autocomplete', async () => {
      await testUserSelectApp(user, 'appB');
      expect(testGetSubstitutionInput().value).toBe('');
    });
  });
});
