import React, { Suspense } from 'react';
import { useModal } from '../hooks/useModal';
import { Layout } from './Layout/Layout';
import { Footer } from './Footer/Footer';
import { FaqButton } from './FaqButton';
import { ThemeSwitcher } from './ThemeSwitcher/ThemeSwitcher';
import { Analytics } from './Analytics';
import { FaqModal } from './FaqModal';
import { ApiQueryMagazine } from '../api/ApiQueryMagazine';
import { useQuery } from '@tanstack/react-query';
import { LoadingScreen } from './Layout/LoadingScreen';
import { useEhContext } from '../context/EhContext';

export interface MainLayoutProps {
  children: React.ReactNode;
}

function HomeWithContext({ children }: MainLayoutProps) {
  const [openFaq, faqDialog] = useModal();
  const {
    hadWatchedInitialTutorial,
    setHadWatchedInitialTutorial,
    recentJumps,
  } = useEhContext();

  const onFaqButton = () => {
    openFaq();
    setHadWatchedInitialTutorial(true);
  };

  const isFaqEnabled = import.meta.env.VITE_ABOUT_ENABLED === 'true';
  return (
    <Layout
      footer={<Footer />}
      headerButtons={
        <>
          {isFaqEnabled && (
            <FaqButton
              onClick={onFaqButton}
              catchAttention={
                !hadWatchedInitialTutorial && recentJumps.length <= 1
              }
            />
          )}
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
  );
}

function OtherMode() {
  const q = useQuery(ApiQueryMagazine.getConfig());
  const { isError, error, isLoading, failureCount } = q;

  if (isLoading) {
    return (
      <Layout>
        <LoadingScreen failureCount={failureCount} />
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div>Sorry, something is wrong: {error?.message}</div>
        <div className={'mt-4'}>
          Please try to{' '}
          <button className={'btn'} onClick={() => window.location.reload()}>
            refresh
          </button>{' '}
          the page
        </div>
      </Layout>
    );
  } else {
    if (q.status === 'pending' && q.fetchStatus === 'idle') {
      // very initial state
      return null;
    }
    return (
      <Layout>
        Sorry, no data from backend available, please try to refresh
      </Layout>
    );
  }
}

export function MainLayout(props: MainLayoutProps) {
  const { data: config } = useQuery(ApiQueryMagazine.getConfig());

  if (config !== undefined) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <HomeWithContext {...props} />
      </Suspense>
    );
  } else {
    return <OtherMode />;
  }
}
