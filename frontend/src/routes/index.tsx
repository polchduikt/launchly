import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from './paths';
import { useAuthStore } from '../store/useAuthStore';
import { getCurrentUserApi } from '../api/auth';
import { AuthLayout } from '../components/layout';

import LandingPage from '../pages/public/Landing/LandingPage';
import BlogPage from '../pages/public/Blog/BlogPage';
import BlogDetailPage from '../pages/public/BlogDetail/BlogDetailPage';
import TermsOfServicePage from '../pages/public/Terms/TermsOfServicePage';
import PrivacyPolicyPage from '../pages/public/Privacy/PrivacyPolicyPage';
import { FaqPage } from '../pages/public/Faq/FaqPage';

const LoginPage = lazy(() => import('../pages/public/Login/LoginPage'));
const RegisterPage = lazy(() => import('../pages/public/Register/RegisterPage'));
const OAuth2Callback = lazy(() => import('../pages/public/OAuth2Callback/OAuth2Callback'));
const DashboardPage = lazy(() => import('../pages/owner/Dashboard/DashboardPage'));
const DashboardStatsPage = lazy(() => import('../pages/owner/DashboardStats/DashboardStatsPage').then(m => ({ default: m.DashboardStatsPage })));
const BotsConnectPage = lazy(() => import('../pages/owner/BotsConnect/BotsConnectPage').then(m => ({ default: m.BotsConnectPage })));
const AutomationsPage = lazy(() => import('../pages/owner/Automations/AutomationsPage').then(m => ({ default: m.AutomationsPage })));
const SettingsPage = lazy(() => import('../pages/owner/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const FlowBuilderPage = lazy(() => import('../pages/owner/FlowBuilder/FlowBuilderPage').then(m => ({ default: m.FlowBuilderPage })));
const ChatPage = lazy(() => import('../pages/owner/Chat/ChatPage').then(m => ({ default: m.ChatPage })));
const ContactsPage = lazy(() => import('../pages/owner/Contacts/ContactsPage').then(m => ({ default: m.ContactsPage })));
const AiPage = lazy(() => import('../pages/owner/Ai/AiPage'));
const OrdersPage = lazy(() => import('../pages/owner/Orders/OrdersPage').then(m => ({ default: m.OrdersPage })));
const BroadcastsPage = lazy(() => import('../pages/owner/Broadcasts/BroadcastsPage').then(m => ({ default: m.BroadcastsPage })));
const BroadcastBuilderPage = lazy(() => import('../pages/owner/BroadcastBuilder/BroadcastBuilderPage').then(m => ({ default: m.BroadcastBuilderPage })));
const CheckoutSuccessPage = lazy(() => import('../pages/owner/CheckoutSuccess/CheckoutSuccessPage'));
const CheckoutCancelPage = lazy(() => import('../pages/owner/CheckoutCancel/CheckoutCancelPage'));
const AcceptableUsePolicyPage = lazy(() => import('../pages/public/Legal/AcceptableUsePolicyPage'));
const AiTermsPage = lazy(() => import('../pages/public/Legal/AiTermsPage'));
const PaymentTermsPage = lazy(() => import('../pages/public/Legal/PaymentTermsPage'));
const BlockedPage = lazy(() => import('../pages/public/Blocked/BlockedPage'));

const AdminStatsPage = lazy(() => import('../pages/admin/AdminStats/AdminStatsPage'));
const AdminChatsPage = lazy(() => import('../pages/admin/AdminChats/AdminChatsPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsers/AdminUsersPage'));
const AdminAutomationsPage = lazy(() => import('../pages/admin/AdminAutomations/AdminAutomationsPage'));
const AdminBroadcastsPage = lazy(() => import('../pages/admin/AdminBroadcasts/AdminBroadcastsPage'));
const AdminLogsPage = lazy(() => import('../pages/admin/AdminLogs/AdminLogsPage'));

const PublicOnlyRoute = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  if (accessToken) {
    const role = user?.role;
    const isAdminOrManager = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';
    return <Navigate to={isAdminOrManager ? ROUTES.ADMIN_HOME : ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

const PrivateRoute = () => {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isSyncing, setIsSyncing] = useState(!user);

  useEffect(() => {
    let isMounted = true;
    const syncUser = async () => {
      if (accessToken) {
        try {
          const latestUser = await getCurrentUserApi();
          if (isMounted) setUser(latestUser);
        } catch (err) {
          console.error('Failed to sync user profile:', err);
        }
      }
      if (isMounted) setIsSyncing(false);
    };

    syncUser();
    return () => { isMounted = false; };
  }, [accessToken, setUser]);

  if (!accessToken) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (isSyncing && !user) {
    return <div className="min-h-screen bg-[#F2EBDD]" />;
  }

  const role = user?.role;
  const isAdminOrManager = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';
  if (isAdminOrManager && !location.pathname.startsWith('/admin')) {
    return <Navigate to={ROUTES.ADMIN_HOME} replace />;
  }

  return <Outlet />;
};

const AdminRoute = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  if (!accessToken) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const role = user?.role;
  const isAdminOrManager = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';
  if (!isAdminOrManager) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path={ROUTES.LANDING} element={<LandingPage />} />
          <Route path={ROUTES.BLOG} element={<BlogPage />} />
          <Route path={ROUTES.BLOG_DETAIL} element={<BlogDetailPage />} />
          <Route path={ROUTES.TERMS} element={<TermsOfServicePage />} />
          <Route path={ROUTES.PRIVACY} element={<PrivacyPolicyPage />} />
          <Route path={ROUTES.FAQ} element={<FaqPage />} />
          <Route path={ROUTES.ACCEPTABLE_USE} element={<AcceptableUsePolicyPage />} />
          <Route path={ROUTES.AI_TERMS} element={<AiTermsPage />} />
          <Route path={ROUTES.PAYMENT_TERMS} element={<PaymentTermsPage />} />
          <Route path={ROUTES.BLOCKED} element={<BlockedPage />} />

          <Route element={<PublicOnlyRoute />}>
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
