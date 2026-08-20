export const ENV = {
  BASE_URL: __ENV.BASE_URL || 'http://localhost:8080',
  API_PREFIX: '/api/v1',
  TIMEOUT: '10s',
  TELEGRAM_SYSTEM_TOKEN: __ENV.TELEGRAM_SYSTEM_TOKEN || '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ123456789',
  DEFAULT_PASSWORD: __ENV.DEFAULT_PASSWORD || 'Password123!',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${ENV.BASE_URL}${ENV.API_PREFIX}/auth/login`,
    REGISTER: `${ENV.BASE_URL}${ENV.API_PREFIX}/auth/register`,
    REFRESH: `${ENV.BASE_URL}${ENV.API_PREFIX}/auth/refresh`,
    ME: `${ENV.BASE_URL}${ENV.API_PREFIX}/auth/me`,
  },
  BOTS: {
    LIST: `${ENV.BASE_URL}${ENV.API_PREFIX}/bots`,
    CREATE: `${ENV.BASE_URL}${ENV.API_PREFIX}/bots`,
    SCHEMA: (botId: string | number) => `${ENV.BASE_URL}${ENV.API_PREFIX}/bots/${botId}/schema`,
    DETAILS: (botId: string | number) => `${ENV.BASE_URL}${ENV.API_PREFIX}/bots/${botId}`,
  },
  TELEGRAM: {
    WEBHOOK: (target: string | number) => `${ENV.BASE_URL}${ENV.API_PREFIX}/telegram/webhook/${target}`,
  },
  CRM: {
    LEADS: (botId: string) => `${ENV.BASE_URL}${ENV.API_PREFIX}/crm/bots/${botId}/leads`,
    LEAD_DETAILS: (leadId: string) => `${ENV.BASE_URL}${ENV.API_PREFIX}/crm/leads/${leadId}`,
    CONVERSATIONS: (botId: string) => `${ENV.BASE_URL}${ENV.API_PREFIX}/crm/bots/${botId}/conversations`,
  },
  BILLING: {
    PLANS: `${ENV.BASE_URL}${ENV.API_PREFIX}/billing/plans`,
    SUBSCRIPTION: `${ENV.BASE_URL}${ENV.API_PREFIX}/billing/subscription`,
    USAGE: `${ENV.BASE_URL}${ENV.API_PREFIX}/billing/usage`,
  },
};
