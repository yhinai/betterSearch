import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize DB once at startup
// Dexie initializes lazily
if (typeof window !== 'undefined') {
  // db.open().catch(...) handled in dbService module scope or on first use
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data is local, so it's technically never "stale" until we mutate it
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);