import { LinkExternal } from '~/ui/linkExternal'
import { useUiSettings } from './UiSettingsContext'
import { useEhTemplate } from './useEhTemplate'

/**
 * Renders the consuming app's `appLinks` for the current selection. A link
 * whose url does not resolve is skipped; a link with a `render` escape hatch
 * draws itself.
 */
export function AppLinksPanel() {
  const { appLinks } = useUiSettings()
  const resolve = useEhTemplate()

  if (!appLinks?.length) {
    return null
  }

  const rendered = appLinks.map((link) => {
    const url = resolve(link.url)
    const title = resolve(link.title) ?? link.title
    if (link.render) {
      return <li key={link.id}>{link.render({ link, title, url, resolve })}</li>
    }
    if (url === undefined) {
      return null
    }
    return (
      <li key={link.id}>
        <LinkExternal
          href={url}
          className="inline-flex items-center gap-2 text-sm"
        >
          <span aria-hidden className="inline-flex size-4 items-center">
            {link.icon}
          </span>
          {title}
        </LinkExternal>
      </li>
    )
  })

  if (rendered.every((item) => item === null)) {
    return null
  }

  return (
    <nav aria-label="App links" data-testid="eh-app-links">
      <ul className="flex flex-wrap gap-x-6 gap-y-2">{rendered}</ul>
    </nav>
  )
}
