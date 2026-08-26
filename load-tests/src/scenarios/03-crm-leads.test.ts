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

interface TestContext {
  token: string;
  botId: number;
}

export function setup(): TestContext {
  const email = 'crm_perf_tester@launchly.com';
  const password = ENV.DEFAULT_PASSWORD;

  const regRes = http.post(
    API_ENDPOINTS.AUTH.REGISTER,
    JSON.stringify({ email, name: 'CRM User', password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  let token: string | null = null;
  if (regRes.status === 200 || regRes.status === 201) {
    try {
      token = JSON.parse(regRes.body as string).accessToken;
    } catch {}
  }

  if (!token) {
    const loginRes = http.post(
      API_ENDPOINTS.AUTH.LOGIN,
      JSON.stringify({ email, password }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (loginRes.status === 200) {
      try {
        token = JSON.parse(loginRes.body as string).accessToken;
      } catch {}
    }
  }

  if (!token) {
    throw new Error('Failed to obtain authentication token during setup');
  }

  const authHeaders = AuthHelper.getAuthHeaders(token);

  const botsRes = http.get(API_ENDPOINTS.BOTS.LIST, { headers: authHeaders });
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
        name: 'CRM Perf Bot',
        description: 'Bot for CRM load testing',
      }),
      { headers: authHeaders }
    );
    if (createBotRes.status === 200 || createBotRes.status === 201) {
      try {
        botId = JSON.parse(createBotRes.body as string).id;
      } catch {}
    }
  }

  if (!botId) {
    throw new Error('Failed to obtain or create bot for CRM testing');
  }

  return {
    token,
    botId,
  };
}

export default function (data?: TestContext) {
  const vuId = __VU;
  const iter = __ITER;
  const ctx = data || setup();
  const headers = AuthHelper.getAuthHeaders(ctx.token);

  const leadsRes = http.get(API_ENDPOINTS.CRM.LEADS(String(ctx.botId)), {
    headers,
    tags: { name: 'CRM_Get_Leads' },
  });

  check(leadsRes, {
    'crm leads returns 200': (r) => r.status === 200,
  });

  const convRes = http.get(API_ENDPOINTS.CRM.CONVERSATIONS(String(ctx.botId)), {
    headers,
    tags: { name: 'CRM_Get_Conversations' },
  });

  check(convRes, {
    'crm conversations returns 200': (r) => r.status === 200,
  });

  if (iter % 5 === 0) {
    const labelRes = http.post(
      `${ENV.BASE_URL}${ENV.API_PREFIX}/crm/labels`,
      JSON.stringify({ name: `VIP_${vuId}_${iter}` }),
      {
        headers,
        tags: { name: 'CRM_Add_Label' },
      }
    );

    check(labelRes, {
      'add crm label returns 200 or 201': (r) => r.status === 200 || r.status === 201,
    });
  }

  sleep(0.5);
}
