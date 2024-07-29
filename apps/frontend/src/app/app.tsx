import { Route, Routes } from 'react-router-dom';
import { Home } from './ui/Home';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
