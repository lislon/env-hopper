import { ChevronDown, ChevronRight, ExternalLinkIcon } from 'lucide-react'
import * as React from 'react'
import { Input } from '~/ui/input'
import { LinkExternal } from '~/ui/linkExternal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/ui/table'

type ResourceJumpMockRow = {
  app: string
  context?: string
  version?: string
  jump?: string
  depth?: number
}

const rows: Array<ResourceJumpMockRow> = [
  { app: 'Payment Gateway', version: 'v.12311' },
  {
    app: 'Transaction Logger',
    version: 'v.12311',
    jump: '[region-01]',
    depth: 1,
  },
  {
    app: 'Gateway - Dashboard',
    version: 'v.12311',
    jump: '[region-01]',
    depth: 1,
  },
  {
    app: 'Gateway - Dashboard #',
    version: 'v.12311',
    jump: '[region-01]',
    depth: 1,
  },
  {
    app: 'Gateway - Admin Scripts',
    version: 'v.12311',
    jump: '[region-01]',
    depth: 1,
  },

  { app: 'Identity Provider', context: 'External', jump: '[global]' },

  { app: 'Customer Portal', version: 'v.12312' },
  {
    app: 'Invoice #',
    context: '[Derive]',
    version: 'v.12312',
    jump: '[region-01]',
    depth: 1,
  },

  { app: 'Inventory API', version: 'v.12311', jump: '[region-01]' },
  { app: 'Get Products', version: 'v.12311', jump: '[region-01]', depth: 1 },

  { app: 'Message Queue', version: 'v.1.6.1', jump: '[region-01]' },
  {
    app: 'order-aggregator-service',
    version: 'v.1.6.1',
    jump: '[region-01]',
    depth: 1,
  },

  { app: 'API Gateway', version: 'release-1', jump: '[global]' },
  {
    app: 'Workflow Engine - Process A',
    version: 'release-1',
    jump: '[global]',
    depth: 1,
  },

  { app: 'Log Analytics', version: '-', jump: '[region-01]' },
  { app: 'Request ID Tracker', version: '-', depth: 1 },
]

const CASE_ID_STORAGE_KEY = 'resourceJump.mock.invoiceId'
const CASE_ID_FORMAT = /^\d{9}$/

function getStoredCaseId() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(CASE_ID_STORAGE_KEY) ?? ''
}

export function ResourceJumpMockTable() {
  const [caseId, setCaseId] = React.useState(getStoredCaseId)
  const [setIsSomeAppExpanded, setIsProdLimsExpanded] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CASE_ID_STORAGE_KEY, caseId)
  }, [caseId])

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader className="bg-muted/30 text-muted-foreground">
            <TableRow>
              <TableHead className="px-3">App</TableHead>
              <TableHead className="px-3">Context</TableHead>
              <TableHead className="px-3">Version</TableHead>
              <TableHead className="px-3">Jump</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const depth = row.depth ?? 0
              const requiresCaseId = row.app === 'Gateway - Dashboard #'
              const trimmedCaseId = caseId.trim()
              const caseIdValid = CASE_ID_FORMAT.test(trimmedCaseId)
              const canJump = requiresCaseId ? caseIdValid : Boolean(row.jump)

              const href = requiresCaseId
                ? `https://example.com?invoiceId=${encodeURIComponent(trimmedCaseId)}`
                : 'https://example.com'

              if (requiresCaseId) {
                const id = `${row.app}-${row.context ?? ''}-${row.version ?? ''}-${row.jump ?? ''}`

                return (
                  <React.Fragment key={id}>
                    <TableRow>
                      <TableCell className="px-3 align-top">
                        <span
                          style={{ paddingLeft: depth * 16 }}
                          className="block"
                        >
                          <button
                            type="button"
                            aria-expanded={setIsSomeAppExpanded}
                            onClick={() => setIsProdLimsExpanded((v) => !v)}
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
                          >
                            {setIsSomeAppExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            <span>{row.app}</span>
                            <span className="text-xs text-muted-foreground">
                              (Invoice ID required)
                            </span>
                          </button>
                        </span>
                      </TableCell>
                      <TableCell className="px-3 align-top">
                        {row.context ?? ''}
                      </TableCell>
                      <TableCell className="px-3 align-top">
                        {row.version ?? ''}
                      </TableCell>
                      <TableCell className="px-3 align-top">
                        {canJump ? (
                          <LinkExternal
                            href={href}
                            rel="noreferrer"
                            className="inline-flex items-center gap-1"
                          >
                            {row.jump ?? 'Jump'}
                            <ExternalLinkIcon className="h-3 w-3" />
                          </LinkExternal>
                        ) : (
                          <span className="text-muted-foreground">
                            {row.jump ?? ''}{' '}
                            <span className="text-xs">(enter Invoice ID)</span>
                          </span>
                        )}
                      </TableCell>
                    </TableRow>

                    {setIsSomeAppExpanded ? (
                      <TableRow>
                        <TableCell colSpan={4} className="px-3 py-3">
                          <div className="flex flex-col gap-2">
                            <div className="max-w-xs">
                              <Input
                                value={caseId}
                                onChange={(e) =>
                                  setCaseId(e.currentTarget.value)
                                }
                                placeholder="Invoice ID (9 digits)"
                                aria-invalid={caseId.length > 0 && !caseIdValid}
                              />
                            </div>
                            {caseId.length > 0 && !caseIdValid ? (
                              <div className="text-xs text-muted-foreground">
                                Invalid Invoice ID format.
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </React.Fragment>
                )
              }

              return (
                <TableRow
                  key={`${row.app}-${row.context ?? ''}-${row.version ?? ''}-${row.jump ?? ''}`}
                >
                  <TableCell className="px-3 align-top">
                    <span style={{ paddingLeft: depth * 16 }} className="block">
                      {canJump ? (
                        <LinkExternal
                          href={href}
                          rel="noreferrer"
                          className="inline-flex items-center gap-2"
                        >
                          <span aria-hidden className="inline-block h-3 w-3" />
                          <span>{row.app}</span>
                          <ExternalLinkIcon className="h-3 w-3" />
                        </LinkExternal>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <span aria-hidden className="inline-block h-3 w-3" />
                          <span>{row.app}</span>
                          {row.jump ? (
                            <ExternalLinkIcon className="h-3 w-3" />
                          ) : null}
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 align-top">
                    {row.context ?? ''}
                  </TableCell>
                  <TableCell className="px-3 align-top">
                    {row.version ?? ''}
                  </TableCell>
                  <TableCell className="px-3 align-top">
                    {row.jump ?? ''}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
