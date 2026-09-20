import React, { Suspense } from 'react'
import { Footer } from './Footer/Footer'
import { Layout } from './Layout/Layout'
import { LoadingScreen } from './Layout/LoadingScreen'
import { ThemeSwitcher } from './ThemeSwitcher/ThemeSwitcher'
import { useLegacyConfig } from '../adapter/legacyApi'

export interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * STUBBED IMPORTS — later waves own these, and each one is a real gap today:
 *  - the FAQ button and modal (`headerButtons`, `modalsAndAnalytics`)
 *  - `<Analytics/>`, which injected the downstream analytics script
 * The absolutely-positioned button bar is kept, so the FAQ button drops back in
 * beside the theme switcher with no layout change.
 */
function HomeWithContext({ children }: MainLayoutProps) {
  return (
    <Layout footer={<Footer />} headerButtons={<ThemeSwitcher />}>
      {children}
    </Layout>
  )
}

function OtherMode() {
  const { isError, error, isLoading, failureCount, status, fetchStatus } =
    useLegacyConfig()

  if (isLoading) {
    return (
      <Layout>
        <LoadingScreen failureCount={failureCount} />
      </Layout>
    )
  }

  if (isError) {
    return (
      <Layout>
        {/* Was `error?.message`; inside the `isError` branch the error cannot be
            null, and the lint rule rejects the dead guard. Same output. */}
        <div>Sorry, something is wrong: {error.message}</div>
        <div className={'mt-4'}>
          Please try to{' '}
          <button className={'btn'} onClick={() => window.location.reload()}>
            refresh
          </button>{' '}
          the page
        </div>
      </Layout>
    )
  } else {
    if (status === 'pending' && fetchStatus === 'idle') {
      // very initial state
      return null
    }
    return (
      <Layout>
        Sorry, no data from backend available, please try to refresh
      </Layout>
    )
  }
}

export function MainLayout(props: MainLayoutProps) {
  const { data: config } = useLegacyConfig()

  if (config !== undefined) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <HomeWithContext {...props} />
      </Suspense>
    )
  } else {
    return <OtherMode />
  }
}
