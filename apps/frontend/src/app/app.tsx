import { Route, Routes } from 'react-router-dom';
import { Home } from './ui/Home';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

export function App() {
  return (
    <div className="flex min-h-screen flex-col items-center dark:bg-gray-800 dark:text-white bg-white text-black w-full">
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </QueryClientProvider>
    </div>
  );
}

export default App;
