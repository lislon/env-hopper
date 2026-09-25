import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

export interface JumpTarget {
  title: string
  url: string
}

/**
 * Page objects for the jump screen. Scenarios name what a person does, and every
 * query selector lives in here, so re-pointing them at the ported UI is one edit
 * rather than one per scenario.
 *
 * Deliberately no `data-testid` dependencies: the two the previous harness used
 * (`quick-jump-section`, `jump-main-button`) sat on components nothing renders,
 * so every scenario built on them had been failing silently. These go through
 * roles and semantics instead — a jump link is a `target="_blank"` anchor in the
 * page's content, because a jump is by definition the link that leaves the app.
 */
export function createResourceJumpUi(user: UserEvent) {
  const jumpAnchors = () =>
    Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'),
      // The chrome leaves the app too — the footer's source link is the one that
      // bit: it counted as a third jump the moment the footer started rendering.
    ).filter((a) => !a.closest('header, footer'))

  const readJumpTargets = (): Array<JumpTarget> =>
    jumpAnchors().map((a) => ({
      title: (a.textContent || '').replace(/\s+/g, ' ').trim(),
      url: a.getAttribute('href') || '',
    }))

  return {
    /** The environments catalog at `/envs`. */
    envCatalog: {
      getRows: async (): Promise<
        Array<{ displayName: string; slug: string }>
      > =>
        within(await screen.findByRole('table'))
          .getAllByRole('row')
          .slice(1) // header
          .map((row) => {
            const [displayName, slug] = within(row)
              .getAllByRole('cell')
              .map((c) => (c.textContent || '').trim())
            return { displayName: displayName ?? '', slug: slug ?? '' }
          }),
    },

    /** Resources offered on the home page, before any environment is chosen. */
    home: {
      getResourceNames: (): Array<string> =>
        Array.from(document.querySelectorAll('.grid .font-medium a'))
          .map((e) => (e.textContent || '').trim())
          .filter(Boolean),
    },

    /** Every jump the current page offers, in render order. */
    jumps: {
      getAll: (): Array<JumpTarget> => readJumpTargets(),

      getUrl: (title: string): string | undefined =>
        readJumpTargets().find((t) => t.title.includes(title))?.url,
    },

    /**
     * The inputs for parameters a url needs but the route cannot supply — an
     * order id, a case id. Identified by placeholder, which is how the app
     * labels them.
     */
    parameters: {
      getInput: (label: string) =>
        screen.findByPlaceholderText(new RegExp(label, 'i')),
      fill: async (label: string, value: string) => {
        const input = await screen.findByPlaceholderText(new RegExp(label, 'i'))
        await user.clear(input)
        await user.type(input, value)
      },
    },

    /** The trail of in-app links above the content: Home / <env> / <app>. */
    breadcrumb: {
      getTrail: (): Array<string> =>
        Array.from(
          document.querySelectorAll<HTMLAnchorElement>(
            'a[href^="/"]:not([target])',
          ),
        )
          // The logo is also a link to `/`, and its text content is the inlined
          // svg's stylesheet.
          .filter((a) => !a.querySelector('svg'))
          .map((a) => (a.textContent || '').replace(/\s+/g, ' ').trim())
          .filter(Boolean),
    },
  }
}
