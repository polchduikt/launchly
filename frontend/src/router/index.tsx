import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import PrivateRoute from '../components/shared/PrivateRoute';
import PublicRoute from '../components/shared/PublicRoute';
import { AuthLayout } from '../components/layouts';
import { Loader2 } from 'lucide-react';

import AdminRoute from '../components/shared/AdminRoute';

const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage'));
const OAuth2Callback = lazy(() => import('../features/auth/pages/OAuth2Callback'));
const LandingPage = lazy(() => import('../features/dashboard/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const DashboardStatsPage = lazy(() => import('../features/dashboard/pages/DashboardStatsPage').then(m => ({ default: m.DashboardStatsPage })));
const BotsConnectPage = lazy(() => import('../features/bot/pages/BotsConnectPage').then(m => ({ default: m.BotsConnectPage })));
const AutomationsPage = lazy(() => import('../features/bot/pages/AutomationsPage').then(m => ({ default: m.AutomationsPage })));
const SettingsPage = lazy(() => import('../features/bot/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const FlowBuilderPage = lazy(() => import('../features/bot/pages/FlowBuilderPage').then(m => ({ default: m.FlowBuilderPage })));
const ChatPage = lazy(() => import('../features/crm/pages/ChatPage').then(m => ({ default: m.ChatPage })));
const ContactsPage = lazy(() => import('../features/crm/pages/ContactsPage').then(m => ({ default: m.ContactsPage })));
const AiPage = lazy(() => import('../features/ai/pages/AiPage'));
const OrdersPage = lazy(() => import('../features/crm/pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const BroadcastsPage = lazy(() => import('../features/broadcast/pages/BroadcastsPage').then(m => ({ default: m.BroadcastsPage })));
const BroadcastBuilderPage = lazy(() => import('../features/broadcast/pages/BroadcastBuilderPage').then(m => ({ default: m.BroadcastBuilderPage })));
const CheckoutSuccessPage = lazy(() => import('../features/billing/pages/CheckoutSuccessPage'));
const CheckoutCancelPage = lazy(() => import('../features/billing/pages/CheckoutCancelPage'));
const BlogPage = lazy(() => import('../features/dashboard/pages/BlogPage'));
const BlogDetailPage = lazy(() => import('../features/dashboard/pages/BlogDetailPage'));
const BlockedPage = lazy(() => import('../features/auth/pages/BlockedPage'));

const AdminStatsPage = lazy(() => import('../features/admin/pages/AdminStatsPage'));
const AdminChatsPage = lazy(() => import('../features/admin/pages/AdminChatsPage'));
const AdminUsersPage = lazy(() => import('../features/admin/pages/AdminUsersPage'));
const AdminAutomationsPage = lazy(() => import('../features/admin/pages/AdminAutomationsPage'));
const AdminBroadcastsPage = lazy(() => import('../features/admin/pages/AdminBroadcastsPage'));
const AdminLogsPage = lazy(() => import('../features/admin/pages/AdminLogsPage'));

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
          <Route path={ROUTES.BLOG} element={<BlogPage />} />
          <Route path={ROUTES.BLOG_DETAIL} element={<BlogDetailPage />} />
          <Route path={ROUTES.BLOCKED} element={<BlockedPage />} />

          <Route element={<PublicRoute />}>
            <Route path={ROUTES.LOGIN} element={<AuthLayout><LoginPage /></AuthLayout>} />
            <Route path={ROUTES.REGISTER} element={<AuthLayout><RegisterPage /></AuthLayout>} />
            <Route path={ROUTES.OAUTH_CALLBACK} element={<OAuth2Callback />} />
          </Route>

          <Route element={<PrivateRoute />}>
            <Route path={ROUTES.HOME} element={<DashboardPage />} />
            <Route path={ROUTES.DASHBOARD} element={<DashboardStatsPage />} />
            <Route path={ROUTES.CONNECT_BOT} element={<BotsConnectPage />} />
            <Route path={ROUTES.AUTOMATIONS} element={<AutomationsPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            <Route path={ROUTES.INTEGRATIONS} element={<SettingsPage />} />
            <Route path={ROUTES.FLOW_BUILDER} element={<FlowBuilderPage />} />
            <Route path={ROUTES.CHAT} element={<ChatPage />} />
            <Route path={ROUTES.CONTACTS} element={<ContactsPage />} />
            <Route path={ROUTES.AI} element={<AiPage />} />
            <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
            <Route path={ROUTES.BROADCASTS} element={<BroadcastsPage />} />
            <Route path={ROUTES.BROADCAST_BUILDER} element={<BroadcastBuilderPage />} />
            <Route path={ROUTES.BILLING_SUCCESS} element={<CheckoutSuccessPage />} />
            <Route path={ROUTES.BILLING_CANCEL} element={<CheckoutCancelPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path={ROUTES.ADMIN_HOME} element={<AdminStatsPage />} />
            <Route path={ROUTES.ADMIN_STATS} element={<AdminStatsPage />} />
            <Route path={ROUTES.ADMIN_CHATS} element={<AdminChatsPage />} />
            <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersPage />} />
            <Route path={ROUTES.ADMIN_AUTOMATIONS} element={<AdminAutomationsPage />} />
            <Route path={ROUTES.ADMIN_BROADCASTS} element={<AdminBroadcastsPage />} />
            <Route path={ROUTES.ADMIN_LOGS} element={<AdminLogsPage />} />
          </Route>

          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
