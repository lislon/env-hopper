import type { AppForCatalog } from '@env-hopper/backend-core'

export function getAppUrl(app: AppForCatalog): string {
  return app.appUrl || '#'
}

export function getAppAccessInstructions(app: AppForCatalog): string {
  const { access } = app

  if (!access) {
    return 'Contact administrator'
  }

  switch (access.type) {
    case 'bot':
      return `Bot: ${access.prompt}`
    case 'ticketing':
      return `Ticketing: ${access.providerId}`
    case 'email':
      return `Email: ${access.contacts.map((c) => c.email).join(', ')}`
    case 'self-service':
      return access.url || access.instructions
    case 'documentation':
      return access.url
    case 'manual':
      return access.instructions
    default:
      return 'Contact administrator'
  }
}
