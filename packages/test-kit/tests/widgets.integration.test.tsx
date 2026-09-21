/**
 * The widgets beside the form, transcribed from the previous UI's behaviour.
 *
 * What a person does here is: pick an environment and an application, then copy
 * the login it takes, the database it talks to, or a kubernetes command for that
 * environment — without leaving the page and without asking anyone.
 *
 * The risk this covers is not the markup, it is the join. Credentials hang off
 * the APP in the current payload while the form's unit is a jump PAGE, so an
 * adapter has to find one from the other; a mistake there shows an empty panel
 * and looks exactly like "the data is not on the wire yet".
 *
 * jsdom has no CSS, so nothing here can see the skin.
 */
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { createBackend, renderApp } from '../src/index'
import type { AppHandle } from '../src/harness/renderApp'

const backend = () =>
  createBackend({
    apps: [
      {
        slug: 'service-booking',
        resourceJumps: '2-pager',
        credentials: [
          {
            slug: 'EU',
            username: 'booking-eu@example.test',
            password: 'pw-eu',
          },
          {
            slug: 'US',
            username: 'booking-us@example.test',
            password: 'pw-us',
          },
        ],
        db: {
          url: 'jdbc:postgresql://db-{{env.meta.dbHost}}:5432/booking',
          username: 'booking_ro',
          password: 'pw-db',
        },
      },
      { slug: 'parts-inventory', resourceJumps: '1-pager' },
    ],
    envs: [
      {
        slug: 'dev',
        templateParams: {
          'env.meta.k8sCtx': 'dev-cluster',
          'env.meta.k8sNs': 'booking-dev',
          'env.meta.dbHost': 'dev-1',
        },
      },
      { slug: 'staging' },
    ],
  })

function comboBox(app: AppHandle, label: string): HTMLInputElement {
  const heading = Array.from(app.container.querySelectorAll('h4')).find(
    (h) => h.textContent.trim() === label,
  )
  const input = heading
    ?.closest('label')
    ?.querySelector<HTMLInputElement>('input')
  if (!input) {
    throw new Error(`no ${label} field on the page`)
  }
  return input
}

async function choose(app: AppHandle, label: string, text: string) {
  const input = comboBox(app, label)
  await app.user.click(input)
  await app.user.clear(input)
  await app.user.type(input, text)
  await app.user.keyboard('{ArrowDown}{Enter}')
}

/** Every copyable value in the panel, as `type|value`, top to bottom. */
const panelFields = (app: AppHandle) =>
  Array.from(
    app.container.querySelectorAll<HTMLInputElement>(
      '[data-testid="widgets-panel"] label.input input',
    ),
  ).map((e) => `${e.type}|${e.value}`)

const panelTabs = (app: AppHandle) =>
  Array.from(
    app.container.querySelectorAll(
      '[data-testid="widgets-panel"] [role="tab"]',
    ),
  ).map((e) => e.textContent)

const toggles = (app: AppHandle) =>
  Array.from(
    app.container.querySelectorAll<HTMLButtonElement>(
      '[data-testid="widgets-panel"] button[aria-pressed]',
    ),
  )

describe('the widgets beside the form', () => {
  const server = setupServer()

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  test('shows the selected application’s login, with the password hidden', async () => {
    const app = await renderApp({ server, backend: backend() })

    await choose(app, 'Environment', 'dev')
    await choose(app, 'Application', 'Service Booking')

    expect(panelFields(app)).toContain('text|booking-eu@example.test')
    expect(panelFields(app)).toContain('password|pw-eu')
  })

  test('offers a tab per login and switches the values', async () => {
    const app = await renderApp({ server, backend: backend() })

    await choose(app, 'Environment', 'dev')
    await choose(app, 'Application', 'Service Booking')
    expect(panelTabs(app)).toEqual(['EU', 'US', 'pods', 'deployments', 'ns'])

    const usTab = app.container.querySelectorAll(
      '[data-testid="widgets-panel"] [role="tab"]',
    )[1]!
    await app.user.click(usTab)

    expect(panelFields(app)).toContain('text|booking-us@example.test')
    expect(panelFields(app)).toContain('password|pw-us')
  })

  test('shows the database url, resolved for the chosen environment', async () => {
    const app = await renderApp({ server, backend: backend() })

    await choose(app, 'Environment', 'dev')
    await choose(app, 'Application', 'Service Booking')

    expect(panelFields(app)).toContain(
      'text|jdbc:postgresql://db-dev-1:5432/booking',
    )
    expect(panelFields(app)).toContain('password|pw-db')
  })

  /** A url with no environment in it is not a url, so the widget stays away. */
  test('keeps the database widget away until an environment is chosen', async () => {
    const app = await renderApp({ server, backend: backend() })

    await choose(app, 'Application', 'Service Booking')

    expect(panelFields(app)).toContain('text|booking-eu@example.test')
    expect(panelFields(app)).not.toContain('password|pw-db')
  })

  test('writes a kubernetes command for the environment’s own cluster', async () => {
    const app = await renderApp({ server, backend: backend() })

    await choose(app, 'Environment', 'dev')

    expect(panelFields(app)).toContain(
      'text|kubectl get pods -o wide --context dev-cluster -n booking-dev',
    )
  })

  /** No namespace declared means every namespace, not an empty flag. */
  test('falls back to all namespaces when the environment declares none', async () => {
    const app = await renderApp({ server, backend: backend() })

    await choose(app, 'Environment', 'staging')

    expect(panelFields(app)).toContain(
      'text|kubectl get pods -o wide --context {{env.meta.k8sCtx}} --all-namespaces',
    )
  })

  test('shows an application with no credentials without any empty boxes', async () => {
    const app = await renderApp({ server, backend: backend() })

    await choose(app, 'Environment', 'dev')
    await choose(app, 'Application', 'Parts Inventory')

    expect(panelTabs(app)).toEqual(['pods', 'deployments', 'ns'])
    expect(panelFields(app)).toHaveLength(1)
  })

  test('reveals the passwords when asked, and hides them again', async () => {
    const app = await renderApp({ server, backend: backend() })

    await choose(app, 'Environment', 'dev')
    await choose(app, 'Application', 'Service Booking')

    const hidden = panelFields(app).filter((f) => f.startsWith('password|'))
    expect(hidden.length).toBeGreaterThan(0)

    const toggle = toggles(app)[0]!
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await app.user.click(toggle)

    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(panelFields(app).filter((f) => f.startsWith('password|'))).toEqual(
      [],
    )

    await app.user.click(toggles(app)[0]!)
    expect(panelFields(app).filter((f) => f.startsWith('password|'))).toEqual(
      hidden,
    )
  })

  /**
   * The settings dialog is opened by ref rather than by a shared element id, so
   * it can coexist with any other dialog on the page.
   */
  test('changes the kubernetes client style from its own dialog', async () => {
    const app = await renderApp({ server, backend: backend() })

    await choose(app, 'Environment', 'dev')

    const gear = app.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Kubernetes client settings"]',
    )!
    expect(app.container.querySelector('dialog[open]')).toBeNull()

    // jsdom implements <dialog>, but not showModal's top-layer behaviour; the
    // `open` attribute is what the test can see.
    await app.user.click(gear)
    const dialog = app.container.querySelector('dialog')!
    expect(dialog.open).toBe(true)

    const k9s = dialog.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]',
    )[1]!
    await app.user.click(k9s)

    expect(panelFields(app)).toContain(
      'text|k9s --context dev-cluster -c pods -n booking-dev ',
    )
  })

  /**
   * The per-app links list is a container with nothing in it until app metadata
   * reaches the payload. Asserted so that filling it in is a visible change here
   * rather than a silent one.
   */
  test('renders the per-app links list, still empty', async () => {
    const app = await renderApp({ server, backend: backend() })

    await choose(app, 'Environment', 'dev')
    await choose(app, 'Application', 'Service Booking')

    const links = app.container.querySelector(
      '[data-testid="app-links-placeholder"]',
    )
    expect(links).toBeInTheDocument()
    expect(links?.children).toHaveLength(0)
  })
})
