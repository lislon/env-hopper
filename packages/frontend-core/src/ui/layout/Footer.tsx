import { AboutPagesLinks } from '~/modules/uiSettings/AboutPagesLinks'
import { useUiSettings } from '~/modules/uiSettings/UiSettingsContext'

export function Footer() {
  const { slots } = useUiSettings()

  return (
    <footer className="footer items-center p-4 bg-base-200 text-base-content mt-8">
      <div className="items-center grid-flow-col flex flex-wrap gap-4">
        {slots?.footer ?? (
          <a
            href="https://github.com/lislon/env-hopper"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover"
          >
            GitHub: lislon/env-hopper
          </a>
        )}
        <AboutPagesLinks />
      </div>
    </footer>
  )
}
