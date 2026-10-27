import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'
import { getTrpcFromMeta } from '~/util/reactQueryUtils'
import { lastActivityAt, useAttention } from '~/util/useAttention'
import { onPageEvent, pageEvents, sanitizeForCopy } from './diagnosticsLog'

/** Opened by `?debug=1` or Ctrl+Shift+D, where the deployment allows it. */
function useDiagnosticsOpen(): boolean {
  const allowed = !!useBootstrapConfig().ui?.diagnostics
  const [open, setOpen] = useState(
    () =>
      typeof location !== 'undefined' &&
      new URLSearchParams(location.search).get('debug') === '1',
  )
  useEffect(() => {
    if (!allowed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd')
        setOpen((o) => !o)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [allowed])
  return allowed && open
}

/** What the panel copies: the page's events for the pair, attention and the backend's checks, made safe. */
export function diagnosticsJson(input: {
  app: string
  env: string
  attentive: boolean
  server: unknown
}): string {
  const mine = pageEvents().filter(
    (e) =>
      (e.data['app'] === undefined || e.data['app'] === input.app) &&
      (e.data['env'] === undefined || e.data['env'] === input.env),
  )
  return JSON.stringify(
    sanitizeForCopy({
      pair: { app: input.app, env: input.env },
      at: new Date().toISOString(),
      attention: {
        attentive: input.attentive,
        lastActivity: new Date(lastActivityAt()).toISOString(),
        visible:
          typeof document === 'undefined' ||
          document.visibilityState !== 'hidden',
      },
      page: mine,
      server: input.server,
    }),
    null,
    2,
  )
}

/**
 * Why the line shows what it shows, for staging and previews only: attention,
 * each answer and push the pair got with its freshness, and what the backend
 * did with the checks it was asked for.
 */
export function DiagnosticsPanel({ app, env }: { app: string; env: string }) {
  const open = useDiagnosticsOpen()
  const attentive = useAttention()
  useSyncExternalStore(onPageEvent, () => pageEvents().length)
  const server = useQuery({
    queryKey: ['diagnostics'],
    enabled: open,
    refetchInterval: 10_000,
    queryFn: (ctx) => getTrpcFromMeta(ctx).diagnostics.query(),
  })
  if (!open) return null
  const mine = pageEvents()
    .filter((e) => e.data['app'] === app && e.data['env'] === env)
    .slice(-15)
    .reverse()
  return (
    <aside className="eh-diagnostics" data-testid="diagnostics-panel">
      <div>
        <b>Diagnostics</b> · {attentive ? 'attentive' : 'idle'} · last activity{' '}
        {new Date(lastActivityAt()).toLocaleTimeString()}
        <button
          type="button"
          onClick={() =>
            void navigator.clipboard.writeText(
              diagnosticsJson({ app, env, attentive, server: server.data }),
            )
          }
        >
          Copy diagnostics
        </button>
      </div>
      <ol>
        {mine.map((e, i) => (
          <li key={`${e.at}-${i}`}>
            {e.at.slice(11, 19)} {e.kind}{' '}
            {e.data['freshness'] ? JSON.stringify(e.data['freshness']) : ''}
          </li>
        ))}
      </ol>
      <div>Backend checks</div>
      <ol>
        {(server.data ?? [])
          .slice(-10)
          .reverse()
          .map((e, i) => (
            <li key={`${e.at}-${i}`}>
              {e.at.slice(11, 19)} {e.kind} {e.detail}
            </li>
          ))}
      </ol>
    </aside>
  )
}
