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

  return (
    <Layout
      footer={<Footer />}
      headerButtons={
        <>
          <FaqButton
            onClick={onFaqButton}
            catchAttention={!hadWatchedInitialTutorial}
          />
          <ThemeSwitcher />
        </>
      }
      modalsAndAnalytics={
        <>
          <Analytics />
          <FaqModal {...faqDialog} />
        </>
      }
    >
      <MainForm />
    </Layout>
  );
}

export function Home() {
  const q = useQuery(ApiQueryMagazine.getConfig());
  const { isSuccess, data: config, isError, error } = q;

  if (isError && config === undefined) {
    return <Layout>Error: {error?.message}</Layout>;
  }

  if (!isSuccess) {
    return (
      <Layout>
        <LoadingScreen />
      </Layout>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <EhContextProvider config={config} error={error}>
        <HomeWithContext />
      </EhContextProvider>
    </Suspense>
  );
}
