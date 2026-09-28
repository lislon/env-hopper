import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { VersionDialog, formatBuiltAt } from '../VersionDialog'

// jsdom ships no `showModal`. Without it the dialog stays closed, and a closed
// `<dialog>` is outside the accessibility tree, so nothing inside is queryable.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
})

// A deployment's own rows, in the shape the backend sends them: a linked id, a
// row whose icon the deployment never shipped, and a plain support link.
const rows = [
  {
    iconId: 'gitlab',
    label: 'Pipeline',
    value: '#3431468',
    href: 'https://example.test/pipelines/3431468',
    description: 'CI run that built this image',
    mono: true,
  },
  {
    iconId: 'not-shipped',
    label: 'Commit',
    value: 'bb157078',
    href: 'https://example.test/commit/bb157078',
    mono: true,
  },
]

const icons = [{ iconId: 'gitlab', svg: '<svg data-testid="gitlab-icon" />' }]

function renderDialog() {
  return render(
    <VersionDialog
      setOpener={(open) => open()}
      version="2.0.1-alpha-20260812145859"
      releaseHref="https://example.test/release"
      rows={rows}
      icons={icons}
      credit="Made by Igor Golovin"
      builtAt="2026-09-26T09:12:00.000Z"
    />,
  )
}

describe('VersionDialog', () => {
  it('renders the core row, the deployment rows and the project home', () => {
    renderDialog()

    expect(
      screen.getByRole('link', { name: 'v2.0.1-alpha-20260812145859' }),
    ).toHaveAttribute('href', 'https://example.test/release')
    expect(screen.getByRole('link', { name: '#3431468' })).toHaveAttribute(
      'href',
      'https://example.test/pipelines/3431468',
    )
    expect(screen.getByText('Pipeline')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'lislon/env-hopper' }),
    ).toHaveAttribute('href', 'https://github.com/lislon/env-hopper')
    expect(screen.getByText('Made by Igor Golovin')).toBeInTheDocument()
  })

  it('renders a deployment-supplied icon and survives an unknown icon id', () => {
    renderDialog()

    expect(screen.getByTestId('gitlab-icon')).toBeInTheDocument()
    // The row itself still renders — an unknown id costs the icon, not the row.
    expect(screen.getByRole('link', { name: 'bb157078' })).toBeInTheDocument()
  })

  it('shows the build date as a day, and nothing when there is none', () => {
    expect(formatBuiltAt('2026-09-26T09:12:00.000Z')).toBe('Built 26 Sep 2026')
    expect(formatBuiltAt(undefined)).toBe('')
    expect(formatBuiltAt('not-a-date')).toBe('')
  })
})
