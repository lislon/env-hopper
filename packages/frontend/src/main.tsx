import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist';
import App from './App';
import './index.css';

const cache = new InMemoryCache();

async function setupApollo() {
  await persistCache({
    cache,
    storage: new LocalStorageWrapper(window.localStorage),
  });

  const client = new ApolloClient({
    uri: 'http://localhost:4000/graphql',
    cache,
  });

  return client;
}

setupApollo().then(client => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </React.StrictMode>
  );
}); 