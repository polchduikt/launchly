import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS, ENV } from '../config/env.config';
import { STAGES } from '../config/thresholds.config';
import { AuthHelper } from '../helpers/auth.helper';

export const options: Options = {
  stages: STAGES.LOAD,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200', 'p(99)<400'],
  },
};

interface TestContext {
  token: string;
  botId: number;
}

export function setup(): TestContext {
  const email = 'analytics_perf_tester@launchly.com';
  const password = ENV.DEFAULT_PASSWORD;

  const regRes = http.post(
    API_ENDPOINTS.AUTH.REGISTER,
    JSON.stringify({ email, name: 'Analytics User', password }),
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
        name: 'Analytics Perf Bot',
        description: 'Bot for load testing',
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
    throw new Error('Failed to obtain or create bot for analytics testing');
  }

  return {
    token,
    botId,
  };
}

export default function (data?: TestContext) {
  const ctx = data || setup();
  const headers = AuthHelper.getAuthHeaders(ctx.token);

  const dashboardRes = http.get(API_ENDPOINTS.ANALYTICS.DASHBOARD(ctx.botId), {
    headers,
    tags: { name: 'Analytics_Dashboard_Stats' },
  });

  check(dashboardRes, {
    'analytics dashboard returns 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
