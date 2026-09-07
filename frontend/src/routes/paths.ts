export const ROUTES = {
  LANDING: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  OAUTH_CALLBACK: '/oauth2/callback',
  HOME: '/home',
  DASHBOARD: '/dashboard',
  CONNECT_BOT: '/connect-bot',
  AUTOMATIONS: '/automations',
  SETTINGS: '/settings',
  FLOW_BUILDER: '/builder',
  CHAT: '/chat',
  CONTACTS: '/contacts',
  AI: '/ai',
  ORDERS: '/orders',
  BROADCASTS: '/broadcasts',
  BROADCAST_BUILDER: '/broadcasts/:id',
  SUPPORT: '/support',
  INTEGRATIONS: '/integrations',
  BILLING_SUCCESS: '/billing/success',
  BILLING_CANCEL: '/billing/cancel',
  BLOG: '/blog',
  BLOG_DETAIL: '/blog/:id',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  FAQ: '/faq',
  ACCEPTABLE_USE: '/acceptable-use',
  AI_TERMS: '/ai-terms',
  PAYMENT_TERMS: '/payment-terms',
  BLOCKED: '/blocked',
  TEMPLATES: '/templates',
  TEMPLATES_CREATE: '/templates/create',
  TEMPLATES_EDIT: '/templates/edit/:shareCode',
  TEMPLATES_DETAIL: '/templates/detail/:shareCode',
  TEMPLATES_INSTALL: '/templates/install/:shareCode',
  ADMIN_HOME: '/admin',
  ADMIN_STATS: '/admin/stats',
  ADMIN_CHATS: '/admin/chats',
  ADMIN_USERS: '/admin/users',
  ADMIN_AUTOMATIONS: '/admin/automations',
  ADMIN_BROADCASTS: '/admin/broadcasts',
  ADMIN_LOGS: '/admin/logs',
  ADMIN_BLOG: '/admin/blog',
} as const;

export const isPublicRoute = (pathname: string): boolean => {
  if (
    pathname === ROUTES.LANDING ||
    pathname === ROUTES.LOGIN ||
    pathname === ROUTES.REGISTER ||
    pathname === ROUTES.BLOCKED ||
    pathname === ROUTES.TERMS ||
    pathname === ROUTES.PRIVACY ||
    pathname === ROUTES.FAQ ||
    pathname === ROUTES.ACCEPTABLE_USE ||
    pathname === ROUTES.AI_TERMS ||
    pathname === ROUTES.PAYMENT_TERMS ||
    pathname === ROUTES.OAUTH_CALLBACK
  ) {
    return true;
  }
  if (
    pathname.startsWith('/blog') ||
    pathname.startsWith('/templates/install') ||
    pathname.startsWith('/templates/detail')
  ) {
    return true;
  }
  return false;
};
