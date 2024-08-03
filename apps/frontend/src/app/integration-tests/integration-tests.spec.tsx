import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../app';
import { describe, it, vi } from 'vitest';
import { getConfig } from '../api';
import { userEvent } from '@testing-library/user-event';
import {
  expectHasHistory,
  testClickJumpAndReturnBtn,
  testFillEnvAndApp,
  testGetEnvComboBox,
  testToggleFavorite,
  testWaitLoading
} from './__utils__/ui-toolbelt';
import { TestFeatureMagazine, TestFixtures, testMagazineMakeFixtures } from './__utils__/tests-magazine';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { localStorageMock, useLocalStorageMock } from './__utils__/useLocalStorageMock';

vi.mock('../api');
vi.mock('../hooks/useLocalStorage');

export interface GivenProps {
  testFixtures: TestFixtures;
}

async function given({ testFixtures }: GivenProps) {
  vi.mocked(getConfig).mockResolvedValue({
    envs: testFixtures.envs || [],
    apps: testFixtures.apps || [],
    substitutions: []
  });

  vi.mocked(useLocalStorage).mockImplementation(useLocalStorageMock);

  if (testFixtures.favorites) {
    localStorageMock['favoriteEnvs'] = testFixtures.favorites;
  }
  if (testFixtures.recentJumps) {
    localStorageMock['recentJumps'] = testFixtures.recentJumps;
  }

  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  const setup = userEvent.setup();
  await testWaitLoading();
  return setup;
}

function testGetRecentJumpsAutocompleteSection() {
  return screen.getByRole('region', {
    name: /🕒 Recent/i
  });
}

describe('Integration tests', () => {

  it('Basic scenario - user can navigate to URL by keyboard', async () => {
    const user = await given({ testFixtures: testMagazineMakeFixtures(TestFeatureMagazine.baseline) });

    await testFillEnvAndApp(user, '1', 'App1');
    const link = await testClickJumpAndReturnBtn(user);

    expect(link.href).toEqual('https://env1.mycompany.com:8250/login');
    expectHasHistory('env1', 'app1');
  });

  it('Recent env are suggested', async () => {
    const user = await given({ testFixtures: testMagazineMakeFixtures(TestFeatureMagazine.baseline) });

    await testFillEnvAndApp(user, '1', 'App1');
    await testClickJumpAndReturnBtn(user);
    await user.click(testGetEnvComboBox());

    const recentSection = screen.getByRole('region', {
      name: /🕒 recent/i
    });
    within(recentSection).getByRole('option', {
      name: /env1/
    });
    screen.debug();
  });

  it('If toggle favorite recent app, the star icon will be added and selection stays in the recent section', async () => {
    const user = await given({ testFixtures: testMagazineMakeFixtures(TestFeatureMagazine.hasRecentJumps) });

    await user.click(testGetEnvComboBox());

    await user.keyboard('1');
    await testToggleFavorite(user, 'env1');
    const recentSection = testGetRecentJumpsAutocompleteSection();

    within(recentSection).getByRole('button', {
      name: /Remove/i
    });
  }, {
    timeout: 100000
  });
});
