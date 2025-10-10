import { stepCountIs, streamText, tool } from 'ai'
import type { LanguageModel, Tool } from 'ai'

import type { Request, Response } from 'express'

export interface AdminChatHandlerOptions {
  /** The AI model to use (from @ai-sdk/openai, @ai-sdk/anthropic, etc.) */
  model: LanguageModel
  /** System prompt for the AI assistant */
  systemPrompt?: string
  /** Tools available to the AI assistant */
  tools?: Record<string, Tool>
  /**
   * Optional function to validate configuration before processing requests.
   * Should throw an error if configuration is invalid (e.g., missing API key).
   * @example
   * validateConfig: () => {
   *   if (!process.env.OPENAI_API_KEY) {
   *     throw new Error('OPENAI_API_KEY is not configured')
   *   }
   * }
   */
  validateConfig?: () => void
}

interface TextPart {
  type: 'text'
  text: string
}

interface UIMessageInput {
  role: 'user' | 'assistant' | 'system'
  content?: string
  parts?: Array<TextPart | { type: string }>
}

interface CoreMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

function convertToCoreMessages(
  messages: Array<UIMessageInput>,
): Array<CoreMessage> {
  return messages.map((msg) => {
    if (msg.content) {
      return { role: msg.role, content: msg.content }
    }
    // Extract text from parts array (AI SDK v3 format)
    const textContent =
      msg.parts
        ?.filter((part): part is TextPart => part.type === 'text')
        .map((part) => part.text)
        .join('') ?? ''
    return { role: msg.role, content: textContent }
  })
}

/**
 * Creates an Express handler for the admin chat endpoint.
 *
 * Usage in thin wrappers:
 *
 * ```typescript
 * // With OpenAI
 * import { openai } from '@ai-sdk/openai'
 * app.post('/api/admin/chat', createAdminChatHandler({
 *   model: openai('gpt-4o-mini'),
 * }))
 *
 * // With Claude
 * import { anthropic } from '@ai-sdk/anthropic'
 * app.post('/api/admin/chat', createAdminChatHandler({
 *   model: anthropic('claude-sonnet-4-20250514'),
 * }))
 * ```
 */
export function createAdminChatHandler(options: AdminChatHandlerOptions) {
  const {
    model,
    systemPrompt = 'You are a helpful admin assistant for the Env Hopper application. Help users manage apps, data sources, and MCP server configurations.',
    tools = {},
    validateConfig,
  } = options

  return async (req: Request, res: Response) => {
    try {
      // Validate configuration if validator provided
      if (validateConfig) {
        validateConfig()
      }

      const { messages } = req.body as { messages: Array<UIMessageInput> }
      const coreMessages = convertToCoreMessages(messages)

      console.log(
        '[Admin Chat] Received messages:',
        JSON.stringify(coreMessages, null, 2),
      )
      console.log('[Admin Chat] Available tools:', Object.keys(tools))

      const result = streamText({
        model,
        system: systemPrompt,
        messages: coreMessages,
        tools,
        // Allow up to 5 steps so the model can call tools and then generate a response
        stopWhen: stepCountIs(5),
        onFinish: (event) => {
          console.log('[Admin Chat] Finished:', {
            finishReason: event.finishReason,
            usage: event.usage,
            hasText: !!event.text,
            textLength: event.text.length,
          })
        },
      })

      // Use UI message stream response which is compatible with AI SDK React hooks
      const response = result.toUIMessageStreamResponse()

      // Copy headers from the response
      response.headers.forEach((value, key) => {
        res.setHeader(key, value)
      })

      // Pipe the stream to the response
      if (response.body) {
        const reader = response.body.getReader()
        const pump = async (): Promise<void> => {
          const { done, value } = await reader.read()
          if (done) {
            res.end()
            return
          }
          res.write(value)
          return pump()
        }
        await pump()
      } else {
        console.error('[Admin Chat] No response body')
        res.status(500).json({ error: 'No response from AI model' })
      }
    } catch (error) {
      console.error('[Admin Chat] Error:', error)
      res.status(500).json({ error: 'Failed to process chat request' })
    }
  }
}

// Re-export tool helper for convenience
export { tool }
