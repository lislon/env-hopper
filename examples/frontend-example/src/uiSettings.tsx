import type { EhUiSettings } from '@env-hopper/frontend-core'

/**
 * Everything a deployment customizes, from the outside. The core ships none of
 * this content — it only provides the slots, the app-links panel and the
 * `{{...}}` template resolver these entries lean on.
 *
 * The data below is invented so the example stands on its own.
 */

function ChatIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H6l-4 3V4Z" />
    </svg>
  )
}

function LogsIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M3 2h7l3 3v9H3V2Z" />
      <path d="M5 7h6M5 10h6" />
    </svg>
  )
}

function SourceIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M6 4 2.5 8 6 12M10 4l3.5 4L10 12" />
    </svg>
  )
}

function TicketsIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M2 5h12v2a1.5 1.5 0 0 0 0 3v2H2v-2a1.5 1.5 0 0 0 0-3V5Z" />
    </svg>
  )
}

export const uiSettings: EhUiSettings = {
  slots: {
    footer: (
      <a
        href="https://chat.example.com/channels/platform-support"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2"
      >
        <ChatIcon />
        Ask the platform team
      </a>
    ),
    aboutPages: [
      {
        id: 'faq',
        title: 'FAQ',
        content: (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              <strong>Why is an environment missing?</strong> Environments come
              from the catalog the backend serves, so a missing one is a
              configuration change rather than a UI change.
            </p>
            <p>
              <strong>Why does a link not show up?</strong> Links are templates.
              One whose url still has an unresolved placeholder for the current
              selection is hidden rather than pointing somewhere broken.
            </p>
          </div>
        ),
      },
    ],
  },
  appLinks: [
    {
      // `{{subdomain}}` is one of the environment's own template params, so it
      // resolves per selected environment without being declared here.
      id: 'logs',
      icon: <LogsIcon />,
      title: 'Logs for {{app.displayName}}',
      url: 'https://logs.{{subdomain}}.example.com/?service={{app.slug}}',
    },
    {
      id: 'source',
      icon: <SourceIcon />,
      title: 'Source',
      url: 'https://git.example.com/example/{{app.slug}}',
    },
    {
      // `??` supplies a default, so this link survives an app whose catalog
      // entry carries no `trackerFilter` in its meta.
      id: 'tickets',
      icon: <TicketsIcon />,
      title: 'Tickets',
      url: 'https://tracker.example.com/issues?env={{env.slug}}&filter={{app.meta.trackerFilter ?? open}}',
    },
  ],
}
