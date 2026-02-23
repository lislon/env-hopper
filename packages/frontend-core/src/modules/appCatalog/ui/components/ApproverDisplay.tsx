import type { AppRole } from '@env-hopper/backend-core'
import { Bot, ExternalLink, Mail, Ticket, User, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/ui/card'
import { Badge } from '~/ui/badge'
import { Button } from '~/ui/button'

// Legacy approver types - kept for backward compatibility
type ApproverBase = {
  comment?: string
  roles?: Array<AppRole>
  approvalPolicy?: string
  postApprovalInstructions?: string
  seeMoreUrls?: Array<string>
}

type BotApprover = ApproverBase & {
  type: 'bot'
  url?: string
  prompt?: string
}

type TicketApprover = ApproverBase & {
  type: 'ticket'
  url?: string
  requestFormTemplate?: string
}

type PersonApprover = ApproverBase & {
  type: 'person'
  email?: string
  url?: string
  description?: string
}

type Approver = BotApprover | TicketApprover | PersonApprover

interface ApproverDisplayProps {
  approver: Approver
}

export function ApproverDisplay({ approver }: ApproverDisplayProps) {
  const getApproverIcon = () => {
    switch (approver.type) {
      case 'bot':
        return <Bot className="size-5" />
      case 'ticket':
        return <Ticket className="size-5" />
      case 'person':
        return <Users className="size-5" />
      default:
        return null
    }
  }

  const getApproverTypeLabel = () => {
    switch (approver.type) {
      case 'bot':
        return 'Bot Approval'
      case 'ticket':
        return 'Ticket System'
      case 'person':
        return 'Person/Group Approval'
      default:
        return 'Unknown'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {getApproverIcon()}
          <CardTitle className="text-lg">{getApproverTypeLabel()}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment */}
        {approver.comment && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Note</div>
            <div className="text-sm text-muted-foreground">
              {approver.comment}
            </div>
          </div>
        )}

        {/* Roles */}
        {approver.roles && approver.roles.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Available Roles</div>
            <div className="flex flex-wrap gap-2">
              {approver.roles.map((role: AppRole, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {role.displayName}
                  {role.description && (
                    <span className="ml-1 text-muted-foreground">
                      - {role.description}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Approval Policy */}
        {approver.approvalPolicy && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Approval Policy</div>
            <div className="text-sm text-muted-foreground">
              {approver.approvalPolicy}
            </div>
          </div>
        )}

        {/* Type-Specific Content */}
        {approver.type === 'bot' && <BotApproverContent approver={approver} />}
        {approver.type === 'ticket' && (
          <TicketApproverContent approver={approver} />
        )}
        {approver.type === 'person' && (
          <PersonApproverContent approver={approver} />
        )}

        {/* Post-Approval Instructions */}
        {approver.postApprovalInstructions && (
          <div className="space-y-1 pt-2 border-t">
            <div className="text-sm font-medium">After Approval</div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {approver.postApprovalInstructions}
            </div>
          </div>
        )}

        {/* See More URLs */}
        {approver.seeMoreUrls && approver.seeMoreUrls.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-sm font-medium">More Information</div>
            <div className="space-y-1">
              {approver.seeMoreUrls.map((url: string, idx: number) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="size-3" />
                  {url}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BotApproverContent({
  approver,
}: {
  approver: Extract<Approver, { type: 'bot' }>
}) {
  const url = approver.url
  const prompt = approver.prompt

  return (
    <div className="space-y-3 pt-2 border-t">
      {prompt && (
        <div className="space-y-1">
          <div className="text-sm font-medium">Suggested Prompt</div>
          <div className="text-sm bg-muted p-2 rounded font-mono">{prompt}</div>
        </div>
      )}

      {url && (
        <Button asChild variant="default" className="w-full">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Bot className="size-4 mr-2" />
            Open Bot
            <ExternalLink className="size-3 ml-1" />
          </a>
        </Button>
      )}
    </div>
  )
}

function TicketApproverContent({
  approver,
}: {
  approver: Extract<Approver, { type: 'ticket' }>
}) {
  const url = approver.url
  const template = approver.requestFormTemplate

  return (
    <div className="space-y-3 pt-2 border-t">
      {template && (
        <div className="space-y-1">
          <div className="text-sm font-medium">Request Template</div>
          <div className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">
            {template}
          </div>
        </div>
      )}

      {url && (
        <Button asChild variant="default" className="w-full">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Ticket className="size-4 mr-2" />
            Create Ticket
            <ExternalLink className="size-3 ml-1" />
          </a>
        </Button>
      )}
    </div>
  )
}

function PersonApproverContent({
  approver,
}: {
  approver: Extract<Approver, { type: 'person' }>
}) {
  const email = approver.email
  const url = approver.url
  const description = approver.description

  return (
    <div className="space-y-3 pt-2 border-t">
      {description && (
        <div className="space-y-1">
          <div className="text-sm font-medium">Details</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      )}

      {email && (
        <Button asChild variant="default" className="w-full">
          <a href={`mailto:${email}`}>
            <Mail className="size-4 mr-2" />
            Email: {email}
          </a>
        </Button>
      )}

      {url && (
        <Button asChild variant="outline" className="w-full">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <User className="size-4 mr-2" />
            More Info
            <ExternalLink className="size-3 ml-1" />
          </a>
        </Button>
      )}
    </div>
  )
}
