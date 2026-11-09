import React, { Suspense } from 'react'
import { Link } from '@tanstack/react-router'
import { Plug } from 'lucide-react'
import { RESTARTING_TEXT, isServerRestarting } from '../../util/error-utils'
import { Analytics } from './Analytics'
import { FaqButton } from './FaqButton'
import { FaqModal } from './FaqModal'
import { Footer } from './Footer/Footer'
import { Layout } from './Layout/Layout'
import { LoadingScreen } from './Layout/LoadingScreen'
import { ThemeSwitcher } from './ThemeSwitcher/ThemeSwitcher'
import { useLegacyConfig } from '../adapter/legacyApi'
import { useModal } from '../hooks/useModal'

export interface MainLayoutProps {
  children: React.ReactNode
}

/**
 * INTENTIONAL DIFF: the about dialog is on by default.
 *
 * The original gated it on `VITE_ABOUT_ENABLED === 'true'`, so it shipped dark
 * unless a build set the flag. The only build that ever unset it was the test one
 * (`=false`), and the deployed config committed `=true`, so "off" was never a
 * state a user saw. Read as an opt-out, the flag keeps its single real use and the
 * dialog does not silently vanish in a build that has no env file — this package
 * has none.
 */
function HomeWithContext({ children }: MainLayoutProps) {
  const [openFaq, faqDialog] = useModal()

  const isFaqEnabled = import.meta.env.VITE_ABOUT_ENABLED !== 'false'

  return (
    <Layout
      footer={<Footer />}
      headerButtons={
        <>
          {/* Icon only below `sm`, where the word would cover the title. */}
          <Link
            to="/mcp"
            className="btn"
            aria-label="MCP: use Env Hopper from your AI agent"
            title="Use Env Hopper from your AI agent"
          >
            <Plug className="w-6 h-6 sm:hidden" aria-hidden="true" />
            <span className="hidden sm:inline">MCP</span>
          </Link>
          {isFaqEnabled && <FaqButton onClick={openFaq} />}
          <ThemeSwitcher />
        </>
      }
      modalsAndAnalytics={
        <>
          <Analytics />
          {isFaqEnabled && <FaqModal {...faqDialog} />}
        </>
      }
    >
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
        <div>
          {isServerRestarting(error)
            ? RESTARTING_TEXT
            : `Sorry, something is wrong: ${error.message}`}
        </div>
        <div className={'mt-4'}>
          Please try to{' '}
          <button
            type="button"
            className={'btn'}
            onClick={() => window.location.reload()}
          >
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
