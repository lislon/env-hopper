import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '~/ui/button'
import { Input } from '~/ui/input'

import { useAdminConfig } from '../context/AdminConfigContext'
import { AdminWelcome } from './AdminWelcome'

export function AdminChat() {
  const config = useAdminConfig()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  // Use DefaultChatTransport which handles UI message stream format (tool calls, etc.)
  const transport = useMemo(
    () => new DefaultChatTransport({ api: config.chatApiUrl }),
    [config.chatApiUrl],
  )

  const { messages, sendMessage, status, error } = useChat({
    transport,
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) {
      return
    }
    sendMessage({ text: input })
    setInput('')
  }

  // Extract text content from message parts
  const getMessageContent = (message: (typeof messages)[0]): string => {
    return message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('')
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <AdminWelcome />
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {getMessageContent(message)}
                  </pre>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <span className="text-muted-foreground text-sm">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-destructive text-sm">Error: {error.message}</p>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
