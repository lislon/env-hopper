import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../app';
import { beforeEach, describe, it, vi } from 'vitest';
import { getConfig } from '../api';
import { userEvent } from '@testing-library/user-event';

vi.mock('../api');

type UserType = ReturnType<typeof userEvent.setup>;

function testMakeEnv(name: string) {
  return {
    name: name,
    meta: {
      subdomain: name,
    },
  };
}

function testMakeApp(name: string) {
  return {
    name: name,
    url: 'https://{subdomain}.mycompany.com:8250/login',
    meta: undefined,
    urlPerEnv: {},
  };
}

async function testWaitLoading() {
  await waitFor(() =>
    screen.getByRole('combobox', {
      name: /environment/i,
    })
  );
}

function expectHasHistory(envName: string, appName: string) {
  screen.getByRole('row', {
    name: envName + ' ' + appName + ' JUMP',
  });
}

function testGetEnvComboBox() {
  return screen.getByRole('combobox', {
    name: /environment/i,
  });
}

async function testFillEnvAndApp(
  user: UserType,
  envName: string,
  appName: string
) {
  await user.click(testGetEnvComboBox());

  await user.keyboard(envName);
  await user.keyboard('{Enter}{Tab}');
  await user.keyboard(appName);
  await user.keyboard('{Enter}{Tab}');
}

async function testClickJumpAndReturnBtn(user: UserType) {
  const link = screen.getByRole<HTMLAnchorElement>('link', {
    name: /JUMP .+/,
  });

  await user.click(link);
  return link;
}

describe('Integration tests', () => {
  let user: UserType;

  beforeEach(async () => {
    vi.mocked(getConfig).mockResolvedValue({
      envs: ['env1', 'env2', 'env3', 'env4'].map(testMakeEnv),
      apps: [testMakeApp('app1')],
      substitutions: [],
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    user = userEvent.setup();

    await testWaitLoading();
  });

  it('Basic scenario - user can navigate to URL by keyboard', async () => {
    await testFillEnvAndApp(user, '1', 'App1');
    const link = await testClickJumpAndReturnBtn(user);

    expect(link.href).toEqual('https://env1.mycompany.com:8250/login');
    expectHasHistory('env1', 'app1');
  });

  it('Recent env are suggested', async () => {
    await testFillEnvAndApp(user, '1', 'App1');
    await testClickJumpAndReturnBtn(user);
    await user.click(testGetEnvComboBox());

    const recentSection = screen.getByRole('region', {
      name: /🕒 recent/i,
    });
    within(recentSection).getByRole('option', {
      name: /env1/,
    });
    screen.debug();
  });
});
