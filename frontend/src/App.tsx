import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AppRouter } from './router';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <LanguageProvider>
          <AppRouter />
        </LanguageProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
