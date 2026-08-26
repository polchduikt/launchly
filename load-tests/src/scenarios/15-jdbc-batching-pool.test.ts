import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS, ENV } from '../config/env.config';
import { AuthHelper } from '../helpers/auth.helper';

export const options: Options = {
  scenarios: {
    batch_writes: {
      executor: 'ramping-arrival-rate',
      startRate: 20,
      timeUnit: '1s',
      preAllocatedVUs: 30,
      maxVUs: 60,
      stages: [
        { target: 60, duration: '10s' },
        { target: 120, duration: '15s' },
        { target: 20, duration: '5s' },
      ],
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
    http_req_duration: ['p(95)<250', 'p(99)<500'],
  },
};

interface TestContext {
  token: string;
  botId: number;
}

export function setup(): TestContext[] {
  const poolSize = 20;
  const contexts: TestContext[] = [];

  for (let i = 1; i <= poolSize; i++) {
    const email = `batch_pool_${i}@loadtest.local`;
    const password = ENV.DEFAULT_PASSWORD;

    let token: string | null = null;
    const regRes = http.post(
      API_ENDPOINTS.AUTH.REGISTER,
      JSON.stringify({ email, name: `Batch Pool ${i}`, password }),
      { headers: { 'Content-Type': 'application/json' } }
    );

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

    if (!token) continue;

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
          name: `Batch Bot ${i}`,
          description: 'Bot for testing JDBC batching and HikariCP',
        }),
        { headers: authHeaders }
      );
      if (createBotRes.status === 200 || createBotRes.status === 201) {
        try {
          botId = JSON.parse(createBotRes.body as string).id;
        } catch {}
      }
    }

    if (botId) {
      contexts.push({ token, botId });
    }
  }

  if (contexts.length === 0) {
    throw new Error('Failed to initialize any user contexts in setup');
  }

  return contexts;
}

export default function (data: TestContext[]) {
  const contexts = Array.isArray(data) && data.length > 0 ? data : setup();
  const ctx = contexts[__VU % contexts.length];
  const iter = __ITER;
  const vuId = __VU;
  const headers = AuthHelper.getAuthHeaders(ctx.token);

  const tagName = `BatchTag_${vuId}_${iter}_${Date.now() % 100000}`;
  const tagRes = http.post(
    `${ENV.BASE_URL}${ENV.API_PREFIX}/broadcast/bots/${ctx.botId}/tags`,
    JSON.stringify({ name: tagName }),
    {
      headers,
      tags: { name: 'Batch_Create_Tag' },
    }
  );

  check(tagRes, {
    'tag created 201': (r) => r.status === 201,
  });

  const labelName = `BatchLabel_${vuId}_${iter}_${Date.now() % 100000}`;
  const labelRes = http.post(
    `${ENV.BASE_URL}${ENV.API_PREFIX}/crm/labels`,
    JSON.stringify({ name: labelName }),
    {
      headers,
      tags: { name: 'Batch_Create_Label' },
    }
  );

  check(labelRes, {
    'label created 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.05);
}
