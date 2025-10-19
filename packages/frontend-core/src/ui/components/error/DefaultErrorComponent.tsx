import type { ErrorComponentProps } from '@tanstack/react-router'
import { BugIcon, RefreshCcwIcon } from 'lucide-react'
import { useState } from 'react'
import { ThemeProvider } from '~/components/theme-provider'
import { Button } from '~/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { MainLayout } from '~/ui/layout/MainLayout'
import { useDb } from '~/userDb/DbContext'
import { isDexieError, isDexieMigrationError } from '~/util/error-utils'

export function Treatment({ error, reset }: ErrorComponentProps) {
  const db = useDb()
  const [isResetting, setIsResetting] = useState(false)

  async function dexieResetDb() {
    setIsResetting(true)
    try {
      await db.resetDatabase()
      console.log('Database deleted and recreated successfully')
      // Reload the page after successful reset
      window.location.reload()
    } catch (resetError) {
      console.error('Failed to reset database:', resetError)
      // Still reload the page even if reset fails, as it might help
      window.location.reload()
    } finally {
      setIsResetting(false)
    }
  }

  if (isDexieError(error)) {
    const isMigrationError = isDexieMigrationError(error)
    const buttonText = isMigrationError 
      ? (isResetting ? 'Clearing database...' : 'Clear database and reload')
      : (isResetting ? 'Resetting...' : 'Try reset local settings')
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => dexieResetDb()}
        disabled={isResetting}
      >
        <RefreshCcwIcon className={isResetting ? 'animate-spin' : ''} />
        {buttonText}
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => reset()}>
        <RefreshCcwIcon />
        Try reset error
      </Button>
      {/* <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.reload()}
      >
        <RefreshCcwIcon />
        Try refresh page
      </Button> */}
    </div>
  )
}

export function DefaultErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MainLayout>
        <Empty role="alert">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BugIcon />
            </EmptyMedia>
            <EmptyTitle>Ooops!</EmptyTitle>
            <EmptyDescription>
              Error inside env-hopper occured: {<i>{error.message}</i>}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Treatment error={error} reset={reset} />

            <div
              className={
                'mt-8 text-center max-w-[90vw] max-h-[80vh] overflow-auto'
              }
            >
              <pre className={'text-left mt-8 text-sm'}>
                {<i>{error.stack}</i>}
              </pre>
            </div>
          </EmptyContent>
        </Empty>
      </MainLayout>
    </ThemeProvider>
  )
}
