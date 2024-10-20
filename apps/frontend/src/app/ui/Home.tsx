import React from 'react';
import { Await, useRouteLoaderData } from 'react-router-dom';
import { MainForm } from './MainForm';
import { EhContextProvider, useEhContext } from '../context/EhContext';
import { EhMainLoaderData } from '../types';
import { useModal } from '../hooks/useModal';
import { Layout } from './Layout/Layout';
import { Footer } from './Footer/Footer';
import { FaqButton } from './FaqButton';
import { ThemeSwitcher } from './ThemeSwitcher/ThemeSwitcher';
import { Analytics } from './Analytics';
import { FaqModal } from './FaqModal';

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
  const loaderData = useRouteLoaderData('root') as EhMainLoaderData;

  return (
    <Await resolve={loaderData.config}>
      {(config) => (
        <EhContextProvider config={config}>
          <HomeWithContext />
        </EhContextProvider>
      )}
    </Await>
  );
}
