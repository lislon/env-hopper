import React, { Suspense } from 'react';
import { MainForm } from './MainForm';
import { EhContextProvider, useEhContext } from '../context/EhContext';
import { useModal } from '../hooks/useModal';
import { Layout } from './Layout/Layout';
import { Footer } from './Footer/Footer';
import { FaqButton } from './FaqButton';
import { ThemeSwitcher } from './ThemeSwitcher/ThemeSwitcher';
import { Analytics } from './Analytics';
import { FaqModal } from './FaqModal';
import { ApiQueryMagazine } from '../api/ApiQueryMagazine';
import { useQuery } from '@tanstack/react-query';
import { LoadingScreen } from './LoadingScreen';

function HomeWithContext() {
  const [openFaq, faqDialog] = useModal();
  const { hadWatchedInitialTutorial, setHadWatchedInitialTutorial } =
    useEhContext();

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
              catchAttention={!hadWatchedInitialTutorial}
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
      <MainForm />
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
    return (
      <Layout>
        Sorry, no data from backend available, please try to refresh
      </Layout>
    );
  }
}

export function Home() {
  const { data: config, error } = useQuery(ApiQueryMagazine.getConfig());

  if (config !== undefined) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <EhContextProvider config={config} error={error}>
          <HomeWithContext />
        </EhContextProvider>
      </Suspense>
    );
  } else {
    return <OtherMode />;
  }
}
