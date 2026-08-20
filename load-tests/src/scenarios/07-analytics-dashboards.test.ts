import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS, ENV } from '../config/env.config';
import { STAGES, THRESHOLDS } from '../config/thresholds.config';
import { AuthHelper } from '../helpers/auth.helper';

export const options: Options = {
  stages: STAGES.LOAD,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200', 'p(99)<400'],
  },
};

let cachedAuth: { token: string; botId: number } | null = null;

function ensureAuth(vuId: number): { token: string; botId: number } | null {
  if (cachedAuth) return cachedAuth;

  const email = `owner_scale_${vuId}@launchly-scale.com`;
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
    token = AuthHelper.register(email, `Scale User ${vuId}`, password);
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
        name: `Analytics Bot ${vuId}`,
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
  const auth = ensureAuth(vuId);

  if (!auth) {
    sleep(1);
    return;
  }

  const headers = AuthHelper.getAuthHeaders(auth.token);

  const dashboardRes = http.get(API_ENDPOINTS.ANALYTICS.DASHBOARD(auth.botId), {
    headers,
    tags: { name: 'Analytics_Dashboard_Stats' },
  });

  check(dashboardRes, {
    'analytics dashboard returns 200': (r) => r.status === 200,
  });

  sleep(0.3);
}
