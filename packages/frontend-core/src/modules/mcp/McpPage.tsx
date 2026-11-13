import { useEffect, useRef, useState } from 'react'
import type { McpTool } from './mcpSetup'
import { MCP_ENDPOINT_PATH, fetchMcpTools, installText } from './mcpSetup'

export interface McpPageProps {
  /** Name the server is added under in the user's MCP client. */
  serverName: string
}

/** Muted text that still clears 4.5:1 on the page background in both themes. */
const MUTED = 'opacity-80'

/**
 * How to use this deployment from an AI agent.
 *
 * The endpoint comes from `window.location.origin`, so each host shows text
 * that works there. The tools are read from the live server, so they
 * cannot drift from what an agent actually gets.
 */
export function McpPage({ serverName }: McpPageProps) {
  const origin = window.location.origin
  const text = installText(serverName, `${origin}${MCP_ENDPOINT_PATH}`)

  const [data, setTools] = useState<Array<McpTool> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
    const previous = document.title
    document.title = 'MCP · Env Hopper'
    return () => {
      document.title = previous
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchMcpTools(origin, controller.signal)
      .then(setTools)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'no response')
      })
    return () => controller.abort()
  }, [origin, reloadKey])

  return (
    <main className="w-full max-w-3xl px-4 flex flex-col gap-8">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-semibold outline-none"
      >
        Use Env Hopper from your AI agent
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">What it does</h2>
        <p className="text-sm">
          Your AI agent gets Env Hopper as tools. Ask in plain words:
        </p>
        <ul className="text-sm space-y-2 pl-6 list-disc marker:text-base-content/60">
          <li>
            <strong className="font-semibold">Find a page:</strong>{' '}
            <span className={MUTED}>
              "staging my-app case 12312" → link to case 12312 on staging
            </span>
          </li>
          <li>
            <strong className="font-semibold">Get test credentials:</strong>{' '}
            <span className={MUTED}>
              "my-app login on staging" → username + password
            </span>
          </li>
          <li>
            <strong className="font-semibold">
              Check where something runs:
            </strong>{' '}
            <span className={MUTED}>
              "where is my-service deployed" → list of envs with versions
            </span>
          </li>
          <li>
            <strong className="font-semibold">Database access:</strong>{' '}
            <span className={MUTED}>
              "my-service database on staging" → connection string + credentials
            </span>
          </li>
          <li>
            <strong className="font-semibold">Generic links (no env):</strong>{' '}
            <span className={MUTED}>
              "kafka topic orders" → env-hopper link (pick env there)
            </span>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3 items-center">
        <h2 className="text-lg font-semibold self-start">Installation</h2>
        <div className="w-full max-w-2xl">
          <CopyBlock label="Paste this into your agent's chat:" value={text} />
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-busy={!data && !error}>
        <h2 className="text-lg font-semibold">
          Tools{data && ` (${data.length})`}
        </h2>
        {error !== null ? (
          <div role="alert" className="alert alert-error flex-col items-start">
            <span>
              Could not reach the MCP server ({error}). Installing it will fail
              until it is back.
            </span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setError(null)
                setReloadKey((k) => k + 1)
              }}
            >
              Try again
            </button>
          </div>
        ) : data === null ? (
          <p role="status" className={`text-sm ${MUTED}`}>
            Reading the tool list…
          </p>
        ) : data.length === 0 ? (
          <p className={`text-sm ${MUTED}`}>The server reported no tools.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {data.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function ToolCard({ tool }: { tool: McpTool }) {
  return (
    <article className="rounded-lg bg-[oklch(var(--b2))] p-4 flex flex-col gap-2">
      <h3 className="flex flex-wrap items-baseline gap-x-3">
        <code className="font-semibold">{tool.name}</code>
        {tool.title && <span className="text-sm">{tool.title}</span>}
      </h3>
      {tool.description && (
        <p className={`text-sm whitespace-pre-line ${MUTED}`}>
          {tool.description}
        </p>
      )}
      {tool.parameters.length === 0 ? (
        <p className={`text-xs ${MUTED}`}>No parameters</p>
      ) : (
        // Scrolls inside the card on a narrow screen rather than squashing.
        <div className="overflow-x-auto">
          {/* Fixed widths for the first three columns, so every tool's table
              lines up under the others. */}
          <table className="table table-sm table-fixed min-w-[32rem]">
            <thead>
              <tr>
                <th className="w-40">Name</th>
                <th className="w-28">Type</th>
                <th className="w-24">Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {tool.parameters.map((p) => (
                <tr key={p.name}>
                  <td>
                    <code>{p.name}</code>
                  </td>
                  <td>{p.type}</td>
                  <td>{p.required ? 'yes' : 'no'}</td>
                  <td>
                    {[
                      p.description,
                      p.enumValues && `One of: ${p.enumValues.join(', ')}`,
                    ]
                      .filter(Boolean)
                      .join('. ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

type CopyState = 'idle' | 'copied' | 'failed'

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state !== 'copied') return
    const timer = setTimeout(() => setState('idle'), 4000)
    return () => clearTimeout(timer)
  }, [state])

  const copy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => setState('copied'))
      .catch(() => setState('failed'))
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">{label}</p>
      <div className="flex items-center gap-2 rounded-lg bg-[oklch(var(--b2))] p-2 pl-4">
        <code className="flex-1 text-xs break-words">{value}</code>
        {/* Fixed width: the label changes, the layout does not. */}
        <button
          type="button"
          className="btn btn-sm w-20 shrink-0"
          onClick={copy}
        >
          {state === 'copied' ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p role="status" className="text-sm min-h-5">
        {state === 'copied' && "Copied. Paste it into your agent's chat."}
        {state === 'failed' &&
          'Could not copy. Select the text above and copy it yourself.'}
      </p>
    </div>
  )
}
