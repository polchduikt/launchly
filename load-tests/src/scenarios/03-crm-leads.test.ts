import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS, ENV } from '../config/env.config';
import { STAGES, THRESHOLDS } from '../config/thresholds.config';
import { AuthHelper } from '../helpers/auth.helper';

export const options: Options = {
  stages: STAGES.LOAD,
  thresholds: THRESHOLDS.DATABASE_WRITE,
};

let cachedAuth: { token: string; botId: number } | null = null;

function ensureAuth(vuId: number): { token: string; botId: number } | null {
  if (cachedAuth) return cachedAuth;

  const email = `crm_scale_${vuId}@launchly-scale.com`;
  const password = ENV.DEFAULT_PASSWORD;

  const loginRes = http.post(
    API_ENDPOINTS.AUTH.LOGIN,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  let token: string | null = null;
  if (loginRes.status === 200) {
    try {
      token = JSON.parse(loginRes.body as string).accessToken;
    } catch {}
  } else {
    token = AuthHelper.register(email, `CRM Owner ${vuId}`, password);
  }

  if (!token) return null;

  const botsRes = http.get(API_ENDPOINTS.BOTS.LIST, {
    headers: AuthHelper.getAuthHeaders(token),
  });

  let botId: number | null = null;
  if (botsRes.status === 200) {
    try {
      const bots = JSON.parse(botsRes.body as string);
      if (Array.isArray(bots) && bots.length > 0) {
        botId = bots[0].id;
      }
    } catch {}
  }

  if (!botId) {
    const createBotRes = http.post(
      API_ENDPOINTS.BOTS.CREATE,
      JSON.stringify({
        name: `CRM Bot ${vuId}`,
        telegramToken: `10000${vuId}:ABCdefGhIJKlmNoPQRsTUVwxyZ123456789`,
      }),
      { headers: AuthHelper.getAuthHeaders(token) }
    );
    if (createBotRes.status === 200 || createBotRes.status === 201) {
      try {
        botId = JSON.parse(createBotRes.body as string).id;
      } catch {}
    }
  }

  cachedAuth = { token, botId: botId || 1 };
  return cachedAuth;
}

export default function () {
  const vuId = __VU;
  const iter = __ITER;
  const auth = ensureAuth(vuId);

  if (!auth) {
    sleep(1);
    return;
  }

  const headers = AuthHelper.getAuthHeaders(auth.token);

  const leadsRes = http.get(API_ENDPOINTS.CRM.LEADS(String(auth.botId)), {
    headers,
    tags: { name: 'CRM_Get_Leads' },
  });

  check(leadsRes, {
    'crm leads returns 200': (r) => r.status === 200,
  });

  const convRes = http.get(API_ENDPOINTS.CRM.CONVERSATIONS(String(auth.botId)), {
    headers,
    tags: { name: 'CRM_Get_Conversations' },
  });

  check(convRes, {
    'crm conversations returns 200': (r) => r.status === 200,
  });

  if (iter % 5 === 0) {
    const labelRes = http.post(
      `${ENV.BASE_URL}${ENV.API_PREFIX}/crm/labels`,
      JSON.stringify({ name: `VIP_${vuId}` }),
      {
        headers,
        tags: { name: 'CRM_Add_Label' },
      }
    );

    check(labelRes, {
      'add crm label returns 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
