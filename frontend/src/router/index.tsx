import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import PrivateRoute from '../components/shared/PrivateRoute';
import PublicRoute from '../components/shared/PublicRoute';
import { AuthLayout } from '../components/layouts';
import { Loader2 } from 'lucide-react';

const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage'));
const OAuth2Callback = lazy(() => import('../features/auth/pages/OAuth2Callback'));
const LandingPage = lazy(() => import('../features/dashboard/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const BotsConnectPage = lazy(() => import('../features/bot/pages/BotsConnectPage').then(m => ({ default: m.BotsConnectPage })));
const AutomationsPage = lazy(() => import('../features/bot/pages/AutomationsPage').then(m => ({ default: m.AutomationsPage })));
const SettingsPage = lazy(() => import('../features/bot/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const FlowBuilderPage = lazy(() => import('../features/bot/pages/FlowBuilderPage').then(m => ({ default: m.FlowBuilderPage })));
const CrmPage = lazy(() => import('../features/crm/pages/CrmPage').then(m => ({ default: m.CrmPage })));
const BroadcastsPage = lazy(() => import('../features/broadcast/pages/BroadcastsPage').then(m => ({ default: m.BroadcastsPage })));
const BroadcastBuilderPage = lazy(() => import('../features/broadcast/pages/BroadcastBuilderPage').then(m => ({ default: m.BroadcastBuilderPage })));

const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <Loader2 className="animate-spin text-indigo-600" size={32} />
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path={ROUTES.LANDING} element={<LandingPage />} />

          <Route element={<PublicRoute />}>
            <Route path={ROUTES.LOGIN} element={<AuthLayout><LoginPage /></AuthLayout>} />
            <Route path={ROUTES.REGISTER} element={<AuthLayout><RegisterPage /></AuthLayout>} />
            <Route path={ROUTES.OAUTH_CALLBACK} element={<OAuth2Callback />} />
          </Route>

          <Route element={<PrivateRoute />}>
            <Route path={ROUTES.HOME} element={<DashboardPage />} />
            <Route path={ROUTES.CONNECT_BOT} element={<BotsConnectPage />} />
            <Route path={ROUTES.AUTOMATIONS} element={<AutomationsPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            <Route path={ROUTES.INTEGRATIONS} element={<SettingsPage />} />
            <Route path={ROUTES.FLOW_BUILDER} element={<FlowBuilderPage />} />
            <Route path={ROUTES.CRM} element={<CrmPage />} />
            <Route path={ROUTES.BROADCASTS} element={<BroadcastsPage />} />
            <Route path={ROUTES.BROADCAST_BUILDER} element={<BroadcastBuilderPage />} />
          </Route>

          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
