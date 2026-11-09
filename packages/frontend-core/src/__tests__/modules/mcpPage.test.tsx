import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { McpPage } from '~/modules/mcp/McpPage'
import { installText } from '~/modules/mcp/mcpSetup'

describe('mcp setup text', () => {
  it('install text is one line in the deployment server name', () => {
    expect(installText('my-eh', 'https://eh.example.com/api/mcp')).toBe(
      'Please install the my-eh MCP server for me. It is a remote HTTP MCP server at https://eh.example.com/api/mcp; add it under the name my-eh.',
    )
  })
})

describe('mcp page', () => {
  const writeText = vi.fn<(text: string) => Promise<void>>()

  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
  })
  afterEach(() => vi.unstubAllGlobals())

  const answer = (result: unknown) =>
    new Response(
      `event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result })}\n\n`,
      { headers: { 'content-type': 'text/event-stream' } },
    )

  const stubServer = (tools: Array<unknown>) =>
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        expect(JSON.parse(init.body as string)).toMatchObject({
          method: 'tools/list',
        })
        return Promise.resolve(answer({ tools }))
      }),
    )

  const getUrlTool = {
    name: 'get_url',
    title: 'Link to a page in an app',
    description: 'Raw text the model reads.',
    inputSchema: {
      properties: {
        env: { type: 'string', description: 'Env name' },
        app: { type: 'string' },
      },
      required: ['env'],
    },
  }

  it('titles the tab, then shows every tool open with a params table', async () => {
    stubServer([
      getUrlTool,
      { name: 'list_envs', title: 'Envs', description: 'All envs.' },
    ])
    render(<McpPage serverName="env-hopper" />)

    expect(document.title).toBe('MCP · Env Hopper')
    expect(screen.getByText('Reading the tool list…')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Tools (2)' }),
    ).toBeInTheDocument()
    expect(document.querySelector('details')).toBeNull()

    const getUrl = screen.getByText('get_url').closest('article')!
    expect(getUrl).toHaveTextContent('Link to a page in an app')
    expect(getUrl).toHaveTextContent('Raw text the model reads.')
    const rows = [...getUrl.querySelectorAll('tr')].map((tr) =>
      [...tr.children].map((cell) => cell.textContent),
    )
    expect(rows).toEqual([
      ['Name', 'Type', 'Required', 'Description'],
      ['env', 'string', 'yes', 'Env name'],
      ['app', 'string', 'no', ''],
    ])

    const listEnvs = screen.getByText('list_envs').closest('article')!
    expect(listEnvs.querySelector('table')).toBeNull()
    expect(listEnvs).toHaveTextContent('No parameters')
  })

  it('says so when the server has no tools', async () => {
    stubServer([])
    render(<McpPage serverName="env-hopper" />)
    expect(
      await screen.findByText('The server reported no tools.'),
    ).toBeInTheDocument()
  })

  it('Copy copies exactly the install text and says what to do next', async () => {
    stubServer([])
    render(<McpPage serverName="my-eh" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(writeText).toHaveBeenCalledWith(
      `Please install the my-eh MCP server for me. It is a remote HTTP MCP server at ${window.location.origin}/api/mcp; add it under the name my-eh.`,
    )
    expect(
      await screen.findByText("Copied. Paste it into your agent's chat."),
    ).toBeInTheDocument()
  })

  it('says so when the clipboard refuses', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    stubServer([])
    render(<McpPage serverName="env-hopper" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(await screen.findByText(/Could not copy/)).toBeInTheDocument()
  })

  it('shows the status when the server fails, and Try again reads again', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 503 }))),
    )
    render(<McpPage serverName="env-hopper" />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach the MCP server (503). Installing it will fail until it is back.',
    )
    stubServer([])
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() =>
      expect(
        screen.getByText('The server reported no tools.'),
      ).toBeInTheDocument(),
    )
  })
})
