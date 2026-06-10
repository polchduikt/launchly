import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import OAuth2Callback from '../features/auth/pages/OAuth2Callback';
import { LandingPage } from '../features/dashboard/pages/LandingPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import { BotsConnectPage } from '../features/bot/pages/BotsConnectPage';
import { AutomationsPage } from '../features/bot/pages/AutomationsPage';
import { SettingsPage } from '../features/bot/pages/SettingsPage';
import PrivateRoute from '../components/shared/PrivateRoute';
import PublicRoute from '../components/shared/PublicRoute';
import { AuthLayout } from '../components/layouts';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/home" element={<DashboardPage />} />
          <Route path="/connect-bot" element={<BotsConnectPage />} />
          <Route path="/automations" element={<AutomationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
