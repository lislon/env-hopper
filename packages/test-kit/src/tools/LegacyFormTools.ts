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

/** One release train row as a person reads it, with its hover card. */
export interface ShownTrain {
  name: string
  date: string | null
  tags: Array<string>
  flagged: boolean
  nowLineBefore: boolean
  cardText: string
  cardLinks: Array<PanelLink>
  cardHighlighted: Array<string>
  /** "build: env, env" per build in the card's "deployed on" list. */
  cardRunningOn: Array<string>
  /** The "+N more" toggle of the card's environment list, or null when all are shown. */
  cardMore: string | null
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

    /** The release trains beside the form, or `null` when that widget is absent. */
    releaseTrains: (): Array<ShownTrain> | null => {
      const root = widget('widget-release-trains')
      if (!root) return null
      return Array.from(
        root.querySelectorAll<HTMLElement>('li[data-train]'),
      ).map((li) => {
        const card = li.querySelector<HTMLElement>(
          '[data-testid="release-train-card"]',
        )
        return {
          name: li.dataset['train'] ?? '',
          date:
            li.querySelector('[data-testid="release-train-date"]')
              ?.textContent ?? null,
          tags: Array.from(li.querySelectorAll('.eh-rt-tag')).map(
            (t) => t.textContent,
          ),
          flagged: !!li.querySelector('[data-testid="release-train-conflict"]'),
          nowLineBefore:
            li.previousElementSibling?.classList.contains('eh-rt-now') ?? false,
          cardText: (card?.textContent ?? '').replace(/\s+/g, ' '),
          cardLinks: Array.from(card?.querySelectorAll('a') ?? []).map((a) => ({
            title: (
              a.querySelector('.eh-rt-label')?.textContent ?? a.textContent
            ).trim(),
            url: a.getAttribute('href') ?? '',
          })),
          cardRunningOn: Array.from(
            card?.querySelectorAll<HTMLElement>('.eh-rt-running > li') ?? [],
          ).map((group) => {
            const build = (
              group.querySelector('.eh-rt-build .eh-rt-label, .eh-rt-build')
                ?.textContent ?? ''
            ).trim()
            const envs = Array.from(
              group.querySelectorAll<HTMLElement>('[data-env]'),
            ).map((e) => e.dataset['env'] ?? '')
            return `${build}: ${envs.join(', ')}`
          }),
          cardMore:
            card?.querySelector('.eh-rt-more')?.textContent.trim() ?? null,
          cardHighlighted: Array.from(
            card?.querySelectorAll('.eh-rt-here') ?? [],
          ).map((e) => e.textContent),
        }
      })
    },

    showAllEnvsOfReleaseTrain: async (name: string) => {
      const more = widget('widget-release-trains')?.querySelector<HTMLElement>(
        `li[data-train="${name}"] .eh-rt-more`,
      )
      if (!more)
        throw new Error(`release train ${name} offers no more environments`)
      await user.click(more)
    },

    hoverReleaseTrain: async (name: string) => {
      const row = widget('widget-release-trains')?.querySelector<HTMLElement>(
        `li[data-train="${name}"] .eh-rt-row`,
      )
      if (!row) throw new Error(`no release train ${name} on screen`)
      await user.hover(row)
    },

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
