import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { AppRouter } from './routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LanguageProvider } from './i18n/config';
import { NetworkStatusBanner } from './components/common/NetworkStatusBanner';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <LanguageProvider>
          <NetworkStatusBanner />
          <AppRouter />
        </LanguageProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
