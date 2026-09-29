import { within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

/** A copyable value in the panel beside the form, with how it is shown. */
export interface PanelValue {
  value: string
  /** `true` when the field hides its value until the reveal toggle is used. */
  isHidden: boolean
}

export interface PanelLink {
  title: string
  url: string
}

/**
 * Page objects for the shipped UI: the two pickers, and the panel of widgets
 * beside them.
 *
 * Every selector lives here so a scenario says what a person does. The widget
 * panel is reached through its one `data-testid` and then by structure, because
 * what a scenario asserts is "which widget is on screen" — and a widget that is
 * absent has no test id to query, which is the case these are mostly about.
 */
export function createLegacyFormUi(user: UserEvent) {
  const panel = () =>
    document.querySelector<HTMLElement>('[data-testid="widgets-panel"]')

  const widget = (testId: string) =>
    panel()?.querySelector<HTMLElement>(`[data-testid="${testId}"]`) ?? null

  const readValues = (root: HTMLElement | null): Array<PanelValue> =>
    root
      ? Array.from(
          root.querySelectorAll<HTMLInputElement>('label.input input'),
        ).map((input) => ({
          value: input.value,
          isHidden: input.type === 'password',
        }))
      : []

  const comboBox = (label: string): HTMLInputElement => {
    const heading = Array.from(document.querySelectorAll('h4')).find(
      (h) => (h.textContent || '').trim() === label,
    )
    const input = heading
      ?.closest('label')
      ?.querySelector<HTMLInputElement>('input')
    if (!input) {
      throw new Error(`no ${label} picker on the page`)
    }
    return input
  }

  const pick = async (label: string, text: string) => {
    const input = comboBox(label)
    await user.click(input)
    await user.clear(input)
    await user.type(input, text)
    await user.keyboard('{ArrowDown}{Enter}')
  }

  return {
    pickEnvironment: (name: string) => pick('Environment', name),
    pickApplication: (name: string) => pick('Application', name),

    /**
     * The app's own login, or `null` when no credentials widget is on screen.
     *
     * `null` and `[]` are different answers and scenarios rely on it: an app with
     * no credentials, and an environment that declares them unavailable, both
     * show nothing — but so would a widget rendering empty boxes, which is a bug
     * the previous UI had and this distinguishes.
     */
    credentials: (): Array<PanelValue> | null => {
      const root = widget('widget-ui-credentials')
      return root ? readValues(root) : null
    },

    /** The app's database connection, or `null` when that widget is absent. */
    database: (): Array<PanelValue> | null => {
      const root = widget('widget-db-credentials')
      return root ? readValues(root) : null
    },

    /** The credential tab strip, empty when the app has a single login. */
    credentialTabs: (): Array<string> =>
      Array.from(panel()?.querySelectorAll('[role="tab"]') ?? []).map((tab) =>
        (tab.textContent || '').trim(),
      ),

    /** The per-app links, in render order. */
    links: (): Array<PanelLink> => {
      const list = panel()?.querySelector<HTMLElement>(
        '[data-testid="app-links"]',
      )
      if (!list) {
        return []
      }
      return within(list)
        .queryAllByRole('link')
        .map((a) => ({
          // An inline svg icon contributes its own stylesheet text, so the title
          // is the last non-empty line rather than the whole text content.
          title:
            (a.textContent || '')
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .at(-1) ?? '',
          url: a.getAttribute('href') || '',
        }))
    },
  }
}
