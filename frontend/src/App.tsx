import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import OAuth2Callback from './features/auth/pages/OAuth2Callback';
import DashboardPage from './pages/DashboardPage';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-surface-container-low text-on-surface font-sans min-h-screen w-full flex items-center justify-center relative p-4 md:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-pattern opacity-60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-low/50 pointer-events-none"></div>
      {children}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
