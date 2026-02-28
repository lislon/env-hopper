import type { AppApprovalMethod, AppForCatalog } from '@env-hopper/backend-core'
import { Bot, Check, Copy, ExternalLink, Settings, Users } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Badge } from '~/ui/badge'
import { Button } from '~/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/ui/table'

// Constants
const COPY_FEEDBACK_DURATION = 2000

interface AccessRequestSectionProps {
  app: AppForCatalog
  approvalMethods: Array<AppApprovalMethod>
}

// Component for rendering markdown links with security attributes
const MarkdownLink = ({
  href,
  children,
}: {
  href?: string
  children?: React.ReactNode
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary hover:underline"
  >
    {children}
  </a>
)

// Helper function for approval method icons
function getApprovalMethodIcon(type: 'service' | 'personTeam' | 'custom') {
  switch (type) {
    case 'service':
      return <Bot className="size-5 text-primary" />
    case 'personTeam':
      return <Users className="size-5 text-primary" />
    case 'custom':
      return <Settings className="size-5 text-primary" />
  }
}

/**
 * Custom hook for handling copy-to-clipboard functionality with feedback
 * Includes proper cleanup to prevent memory leaks
 */
function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setError(null)

      // Set new timeout with cleanup
      timeoutRef.current = setTimeout(() => {
        setCopiedId(null)
      }, COPY_FEEDBACK_DURATION)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      setError('Failed to copy')

      // Clear error after duration
      timeoutRef.current = setTimeout(() => {
        setError(null)
      }, COPY_FEEDBACK_DURATION)
    }
  }, [])

  return { copiedId, error, copyToClipboard }
}

/**
 * Reusable copy button component with accessibility
 */
interface CopyButtonProps {
  onCopy: () => void
  isCopied: boolean
  ariaLabel: string
  className?: string
}

function CopyButton({
  onCopy,
  isCopied,
  ariaLabel,
  className,
}: CopyButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onCopy}
      className={className}
      aria-label={ariaLabel}
      title={isCopied ? 'Copied!' : 'Copy to clipboard'}
    >
      {isCopied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-600" />
          <span className="sr-only" role="status" aria-live="polite">
            Copied to clipboard
          </span>
        </>
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

export function AccessRequestSection({
  app,
  approvalMethods,
}: AccessRequestSectionProps) {
  const { copiedId, copyToClipboard } = useCopyToClipboard()
  const accessRequest = app.accessRequest
  const approvalMethod = approvalMethods.find(
    (m) => m.slug === accessRequest?.approvalMethodId,
  )

  const handleCopyPrompt = useCallback(() => {
    if (accessRequest?.requestPrompt) {
      copyToClipboard(accessRequest.requestPrompt, 'prompt')
    }
  }, [accessRequest?.requestPrompt, copyToClipboard])

  const handleCopyApproverEmail = useCallback(
    (email: string, index: number) => {
      copyToClipboard(email, `approver-${index}`)
    },
    [copyToClipboard],
  )

  // Early return if no access request
  if (!accessRequest) return null

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-sm font-medium">Access Request</h3>

      {/* Approval Method */}
      {approvalMethod && approvalMethod.type !== 'custom' && (
        <div className="flex items-center gap-2">
          {approvalMethod.type === 'service' && approvalMethod.config.url ? (
            <>
              <a
                href={approvalMethod.config.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
                title={approvalMethod.config.url}
              >
                <div>{getApprovalMethodIcon(approvalMethod.type)}</div>
                <div className="font-medium">{approvalMethod.displayName}</div>
              </a>
              <a
                href={approvalMethod.config.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
                title={approvalMethod.config.url}
              >
                <ExternalLink className="size-4" />
              </a>
            </>
          ) : (
            <>
              <div>{getApprovalMethodIcon(approvalMethod.type)}</div>
              <div className="font-medium">{approvalMethod.displayName}</div>
            </>
          )}
        </div>
      )}

      {/* Request Prompt - Inline */}
      {accessRequest.requestPrompt && (
        <div className="text-sm inline-flex items-center gap-2">
          <span className="whitespace-nowrap shrink-0">Request Prompt:</span>
          <span className="prose prose-sm inline [&>*]:inline [&>*]:m-0">
            <ReactMarkdown components={{ a: MarkdownLink }}>
              {accessRequest.requestPrompt}
            </ReactMarkdown>
          </span>
          <CopyButton
            onCopy={handleCopyPrompt}
            isCopied={copiedId === 'prompt'}
            ariaLabel="Copy request prompt"
            className="h-6 w-6 p-0 shrink-0"
          />
        </div>
      )}

      {/* Comments */}
      {accessRequest.comments && (
        <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
          <ReactMarkdown components={{ a: MarkdownLink }}>
            {accessRequest.comments}
          </ReactMarkdown>
        </div>
      )}

      {/* Roles Table */}
      {accessRequest.roles && accessRequest.roles.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium">Available Roles</h4>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Role</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessRequest.roles.map((role, idx) => (
                  <TableRow key={`${role.displayName}-${idx}`}>
                    <TableCell className="font-medium">
                      {role.displayName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {role.description || '—'}
                      {role.adminNotes && (
                        <div className="mt-1 text-xs italic text-muted-foreground/80">
                          Note: {role.adminNotes}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Approvers */}
      {accessRequest.approvers && accessRequest.approvers.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium">Approvers</h4>
          <div className="flex flex-wrap gap-2">
            {accessRequest.approvers.map((approver, idx) => {
              const approverId = `approver-${idx}`
              const isCopied = copiedId === approverId

              return (
                <Badge
                  key={`${approver.displayName}-${idx}`}
                  variant="outline"
                  className="font-normal inline-flex items-center gap-1"
                >
                  {approver.displayName}
                  {approver.contact && (
                    <>
                      <span className="text-xs opacity-70">
                        ({approver.contact})
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyApproverEmail(approver.contact!, idx)
                        }}
                        className="inline-flex items-center justify-center hover:bg-accent rounded p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                        aria-label={`Copy ${approver.displayName}'s email`}
                        title={isCopied ? 'Copied!' : 'Copy email'}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-green-600" />
                            <span
                              className="sr-only"
                              role="status"
                              aria-live="polite"
                            >
                              Email copied to clipboard
                            </span>
                          </>
                        ) : (
                          <Copy className="h-3 w-3 opacity-50 hover:opacity-100" />
                        )}
                      </button>
                    </>
                  )}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Documentation URLs */}
      {accessRequest.urls && accessRequest.urls.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium">Documentation</h4>
          <div className="flex flex-col gap-1.5">
            {accessRequest.urls.map((urlObj, idx) => (
              <a
                key={`${urlObj.url}-${idx}`}
                href={urlObj.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1.5"
              >
                {urlObj.label || urlObj.url}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Post-Approval Instructions - Collapsible (secondary info) */}
      {accessRequest.postApprovalInstructions && (
        <Accordion type="single" collapsible>
          <AccordionItem
            value="post-approval"
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="text-sm hover:no-underline py-3">
              Post-Approval Instructions
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                <ReactMarkdown components={{ a: MarkdownLink }}>
                  {accessRequest.postApprovalInstructions}
                </ReactMarkdown>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}
