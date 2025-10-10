import { ThemeProvider } from '~/components/theme-provider'
import { MainLayout } from './MainLayout'
import { Spinner } from '~/components/ui/spinner'
import { Badge } from '~/components/ui/badge'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { Button } from '~/components/ui/button'

export interface LoadingFallbackProps {
  label?: string
  failureCount?: number
  failureReason?: string
}

function Explanation({ failureCount, failureReason }: LoadingFallbackProps) {
  if (!failureCount) {
    return null
  }
  return (
    <>
      <div className={'mt-2 text-xs'}>Attempt {failureCount}</div>
      {failureReason && (
        <div className={'mt-2 text-xs text-secondary-foreground'}>
          {failureReason}
        </div>
      )}
    </>
  )
}

export function LoadingScreen({
  failureCount,
  label,
  failureReason,
}: LoadingFallbackProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MainLayout>
        <div className="flex flex-col items-center w-full  gap-4 ">
          {/* <span className="loading loading-bars loading-lg"></span> */}
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner />
              </EmptyMedia>
              <EmptyTitle>Loading {label}...</EmptyTitle>
              <EmptyDescription>
                <Explanation
                  failureCount={failureCount}
                  failureReason={failureReason}
                ></Explanation>{' '}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </MainLayout>
    </ThemeProvider>
  )
}
