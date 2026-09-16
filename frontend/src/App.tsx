import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { AppRouter } from './routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LanguageProvider } from './i18n/config';
import { NetworkStatusBanner } from './components/common/NetworkStatusBanner';
import { ToastContainer } from './components/common/Toast';
import { useMultiTabSync } from './hooks/useMultiTabSync';

const AppContent: React.FC = () => {
  useMultiTabSync();

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <NetworkStatusBanner />
        <ToastContainer />
        <AppRouter />
      </LanguageProvider>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
