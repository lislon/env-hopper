/**
 * The jump form, transcribed from the previous UI's own behaviour.
 *
 * What a person does here is: pick an environment, pick an application, and if
 * that application's url needs a value, type it — then the jump link is ready.
 * Every expectation below was read off the previous UI's source.
 *
 * jsdom has no CSS, so nothing here can see the skin; appearance is the
 * screenshot's job. What it CAN see is the structure and the wiring, which is
 * where the port's real risk is: the previous data vocabulary no longer exists,
 * so these fields are driven by an adapter over different payloads.
 */
import { setupServer } from 'msw/node'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest'
import { createBackend, magazine, renderApp } from '../src/index'
import type { AppHandle } from '../src/harness/renderApp'

/**
 * The fictional car shop: `service-booking` is a two-pager, so its second page
 * is a jump whose url needs an order id typed in — the only fixture that
 * exercises the value field.
 */
const carShop = () => createBackend(magazine.carShop())

const envInput = (app: AppHandle) =>
  app.container.querySelector<HTMLInputElement>(
    'label:has(h4) input.input-bordered',
  )

/** The two comboboxes are told apart by the heading inside their own label. */
function comboBox(app: AppHandle, label: string): HTMLInputElement {
  const heading = Array.from(app.container.querySelectorAll('h4')).find(
    (h) => h.textContent?.trim() === label,
  )
  const input = heading?.closest('label')?.querySelector('input')
  if (!input) {
    throw new Error(`no ${label} field on the page`)
  }
  return input as HTMLInputElement
}

/** Types into a combobox and takes the first suggestion, as Enter does. */
async function choose(app: AppHandle, label: string, text: string) {
  const input = comboBox(app, label)
  await app.user.click(input)
  await app.user.clear(input)
  await app.user.type(input, text)
  await app.user.keyboard('{ArrowDown}{Enter}')
  return input
}

const jumpLink = (app: AppHandle) =>
  app.container.querySelector<HTMLAnchorElement>('#jump-main-button')

describe('jump form', () => {
  const server = setupServer()

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.classList.remove('dark')
  })

  test('offers an environment field and an application field', async () => {
    const app = await renderApp({ server, backend: carShop() })

    expect(comboBox(app, 'Environment')).toBeInTheDocument()
    expect(comboBox(app, 'Application')).toBeInTheDocument()
  })

  /**
   * The hint names an environment the person could type, and which one it names
   * has to be stable: it used to be drawn from a shuffled list, so it changed on
   * nearly every render.
   */
  test('the environment field hints at a real environment, the same one twice', async () => {
    const first = await renderApp({ server, backend: carShop() })
    const hint = comboBox(first, 'Environment').placeholder
    expect(hint).toMatch(/^Type or select environment/)

    const second = await renderApp({ server, backend: carShop() })
    expect(comboBox(second, 'Environment').placeholder).toBe(hint)
  })

  test('there is nothing to jump to until an environment and an application are chosen', async () => {
    const app = await renderApp({ server, backend: carShop() })

    expect(jumpLink(app)).toBeNull()
    expect(app.container.textContent).toContain('Select')
  })

  test('choosing an environment and an application makes the jump ready', async () => {
    const app = await renderApp({ server, backend: carShop() })

    await choose(app, 'Environment', 'staging')
    await choose(app, 'Application', 'Parts Inventory')

    expect(jumpLink(app)).toHaveAttribute(
      'href',
      'http://localhost:4000/env/staging/app/parts-inventory',
    )
    expect(jumpLink(app)).toHaveAttribute('target', '_blank')
  })

  /**
   * The gap this closes is real, not cosmetic: the replacement UI renders no
   * input for a late parameter at all, so a jump needing one cannot be completed
   * there.
   */
  describe('a url that needs a value typed in', () => {
    test('asks for the value instead of offering a broken link', async () => {
      const app = await renderApp({ server, backend: carShop() })

      await choose(app, 'Environment', 'dev')
      await choose(app, 'Application', 'Order Details')

      expect(await app.findByTestId('substitution-input')).toBeInTheDocument()
      expect(jumpLink(app)).toBeNull()
      expect(app.container.textContent).toContain('Order ID')
    })

    test('completes the jump once the value is typed', async () => {
      const app = await renderApp({ server, backend: carShop() })

      await choose(app, 'Environment', 'dev')
      await choose(app, 'Application', 'Order Details')
      await app.user.type(
        await app.findByTestId('substitution-input'),
        'ORD-7788',
      )

      expect(jumpLink(app)).toHaveAttribute(
        'href',
        'http://localhost:4000/env/dev/app/service-booking/order/ORD-7788',
      )
    })

    test('the value field is asked for by name and holds what was typed', async () => {
      const app = await renderApp({ server, backend: carShop() })

      await choose(app, 'Environment', 'dev')
      await choose(app, 'Application', 'Order Details')
      const value = await app.findByTestId('substitution-input')
      await app.user.type(value, 'ORD-1')

      expect(value).toHaveValue('ORD-1')
      expect(value).toHaveAttribute('placeholder', 'Enter Order ID')
    })
  })

  /**
   * A link that arrives with the choices already in it has to open on those
   * choices — that is what makes a jump link shareable.
   */
  describe('a link that already carries the choices', () => {
    test('opens with the environment and application filled in', async () => {
      const app = await renderApp({
        server,
        backend: carShop(),
        initialLink: '/env/staging/app/parts-inventory',
      })

      expect(comboBox(app, 'Environment')).toHaveValue('staging')
      expect(comboBox(app, 'Application')).toHaveValue('Parts Inventory')
      expect(jumpLink(app)).toHaveAttribute(
        'href',
        'http://localhost:4000/env/staging/app/parts-inventory',
      )
    })

    test('an environment on its own opens with just that filled in', async () => {
      const app = await renderApp({
        server,
        backend: carShop(),
        initialLink: '/env/prod',
      })

      expect(comboBox(app, 'Environment')).toHaveValue('prod')
      expect(jumpLink(app)).toBeNull()
    })
  })

  /** Choosing is remembered, so the next visit starts where the last one ended. */
  test('the last choices come back on the next visit', async () => {
    const first = await renderApp({ server, backend: carShop() })
    await choose(first, 'Environment', 'staging')
    await choose(first, 'Application', 'Parts Inventory')

    const second = await renderApp({ server, backend: carShop() })

    expect(comboBox(second, 'Environment')).toHaveValue('staging')
    expect(comboBox(second, 'Application')).toHaveValue('Parts Inventory')
  })

  /** Only one page title at a time: the chrome must not be drawn twice. */
  test('the page carries exactly one header', async () => {
    const app = await renderApp({ server, backend: carShop() })

    expect(document.querySelectorAll('header')).toHaveLength(1)
    expect(envInput(app)).not.toBeNull()
  })
})
