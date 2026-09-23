/**
 * The app shell, transcribed from the previous UI's own behaviour.
 *
 * Every expectation below was read off the previous UI's source, not invented:
 * the chrome it renders, the version chip's two states, and the theme switch's
 * contract (an attribute on <html>, a localStorage key, and a button whose title
 * names the theme it would switch TO).
 *
 * jsdom has no CSS, so nothing here can see the skin. It can see that the scope
 * the skin needs is present, and that is all it claims to check — appearance is
 * the screenshot gate's job.
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
import { setUiSkin } from '@env-hopper/frontend-core'
import { renderApp } from '../src/index'

describe('app shell', () => {
  const server = setupServer()

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  // The theme lives on <html>, which jsdom shares across every test in the file
  // — unmounting the app does not take it back off. Without this, one test's
  // chosen theme is the next one's starting state.
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.classList.remove('dark')
  })

  test('the skin renders its chrome: logo home link, product name, source link', async () => {
    const app = await renderApp({ server })

    expect(app.getByTitle('Home Page')).toHaveAttribute('href', '/')
    expect(app.getByText('Env hopper')).toBeInTheDocument()
    expect(app.getByTitle('Source code')).toHaveAttribute(
      'href',
      'https://github.com/lislon/env-hopper',
    )
  })

  /**
   * The whole styling mechanism: the vendored stylesheet is the previous UI's
   * compiled CSS with every selector scoped under `.eh-legacy`. No scope, no
   * skin — and jsdom would not notice, which is exactly why this is asserted
   * structurally.
   */
  test('the chrome sits inside the skin scope', async () => {
    const app = await renderApp({ server })

    const scope = app.container.querySelector('.eh-legacy')
    expect(scope).not.toBeNull()
    expect(scope).toContainElement(app.getByTitle('Home Page'))
    expect(scope).toContainElement(app.getByTitle('Source code'))
  })

  /*
   * A dev build says `Local` rather than the previous UI's `versions`, which was
   * a label nobody could act on. `versions` is still what a deployed build shows
   * with no version known; tests run as a dev build, so this is the `Local` side.
   */
  test('the version chip reads "Local" until a version is known', async () => {
    const app = await renderApp({ server })

    const release = app.getByTitle('View release on GitHub')
    expect(release).toHaveTextContent('Local')
    expect(release).toHaveAttribute(
      'href',
      'https://github.com/lislon/env-hopper/releases/',
    )
  })

  test('a known version becomes a tagged release link', async () => {
    localStorage.setItem('version', JSON.stringify('1.2.3'))

    const app = await renderApp({ server })

    const release = app.getByTitle('View release on GitHub')
    expect(release).toHaveTextContent('v1.2.3')
    expect(release).toHaveAttribute(
      'href',
      'https://github.com/lislon/env-hopper/releases/tag/v1.2.3',
    )
  })

  describe('theme', () => {
    test('starts light, and the button offers the other theme', async () => {
      const app = await renderApp({ server })

      expect(document.documentElement).toHaveAttribute('data-theme', 'light')
      expect(app.getByTitle('Switch to dark theme')).toBeInTheDocument()
    })

    /**
     * The previous UI drove its theme off `data-theme`; the current stylesheet
     * keys dark mode off a `.dark` class. Both sheets are loaded at once, so the
     * switch has to move both or half the page stays on the old theme.
     */
    test('switching sets both the attribute and the class', async () => {
      const app = await renderApp({ server })

      await app.user.click(app.getByTitle('Switch to dark theme'))

      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(app.getByTitle('Switch to light theme')).toBeInTheDocument()
    })

    /**
     * The stored value is a BARE string, not JSON. The theme library that also
     * owns this key assigns it straight onto `<html>`'s class list, so a
     * JSON-encoded value put a quoted token there — matching nothing — and
     * overwrote the real `dark` class. The theme then looked right until the
     * next load and silently reverted. Asserting the raw form here is what
     * keeps the two writers agreeing.
     */
    test('the choice is remembered for the next visit', async () => {
      const first = await renderApp({ server })
      await first.user.click(first.getByTitle('Switch to dark theme'))
      expect(localStorage.getItem('theme')).toBe('dark')

      const second = await renderApp({ server })

      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
      // The class too: the attribute alone looked right while the page was light.
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(second.getByTitle('Switch to light theme')).toBeInTheDocument()
    })

    /*
     * What a returning user of the previous UI actually has stored: that UI
     * JSON-encoded every value, so the key holds `"dark"` with the quotes. The
     * theme library copies the stored value onto `<html>`'s class list, and a
     * quoted token matches nothing, so the page rendered light under a toggle
     * showing dark — the user's choice kept and silently not applied.
     */
    test("a returning user's dark choice from the previous UI still applies", async () => {
      localStorage.setItem('theme', JSON.stringify('dark'))

      const app = await renderApp({ server })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.className).not.toContain('"')
      expect(localStorage.getItem('theme')).toBe('dark')
      expect(app.getByTitle('Switch to light theme')).toBeInTheDocument()
    })

    /*
     * The previous UI stored a page of an app as `<app>/<page>`, and `<app>/home`
     * for the home page; this app's ids drop `/home` and write any other `/` as
     * `@`. A returning user's favourites were kept but matched nothing, so the
     * star showed empty and the quick bars were blank.
     */
    test("a returning user's favourite app from the previous UI is still a favourite", async () => {
      localStorage.setItem('favoriteApps', JSON.stringify(['app1/home']))

      const app = await renderApp({ server, initialLink: '/env/dev/app/app1' })

      expect(app.getAllByTitle('Remove from favorites')).toHaveLength(1)
      expect(localStorage.getItem('favoriteApps')).toBe('["app1"]')
    })

    test('switching back returns to light', async () => {
      const app = await renderApp({ server })

      await app.user.click(app.getByTitle('Switch to dark theme'))
      await app.user.click(app.getByTitle('Switch to light theme'))

      expect(document.documentElement).toHaveAttribute('data-theme', 'light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  /**
   * The seam for a future replacement UI. It is per-device browser state, so the
   * url is untouched: the same link opens the same page on either skin.
   */
  describe('skin seam', () => {
    test('the previous UI is the default', async () => {
      const app = await renderApp({ server })

      expect(app.container.querySelector('.eh-legacy')).not.toBeNull()
    })

    test('choosing the other skin drops the chrome, not the page', async () => {
      setUiSkin('modern')

      const app = await renderApp({ server })

      expect(app.container.querySelector('.eh-legacy')).toBeNull()
      expect(app.queryByTitle('Home Page')).toBeNull()
      expect(app.ui.getCurrentPath()).toBe('/')
    })

    test('a deep link is unaffected by the skin', async () => {
      setUiSkin('modern')
      const modern = await renderApp({
        server,
        initialLink: '/env/dev/app/app1',
      })
      expect(modern.ui.getCurrentPath()).toBe('/env/dev/app/app1')

      setUiSkin('legacy')
      const legacy = await renderApp({
        server,
        initialLink: '/env/dev/app/app1',
      })
      expect(legacy.ui.getCurrentPath()).toBe('/env/dev/app/app1')
    })
  })
})
