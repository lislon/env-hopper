export interface AdminConfig {
  /** API endpoint for chat - defaults to /api/admin/chat */
  chatApiUrl?: string
}

export interface AdminChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date
}
