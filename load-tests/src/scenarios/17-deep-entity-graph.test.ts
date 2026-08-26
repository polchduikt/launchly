import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS, ENV } from '../config/env.config';
import { AuthHelper } from '../helpers/auth.helper';

export const options: Options = {
  scenarios: {
    entity_graph_read_load: {
      executor: 'ramping-arrival-rate',
      startRate: 20,
      timeUnit: '1s',
      preAllocatedVUs: 30,
      maxVUs: 80,
      stages: [
        { target: 60, duration: '10s' },
        { target: 120, duration: '15s' },
        { target: 20, duration: '5s' },
      ],
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
    http_req_duration: ['p(95)<150', 'p(99)<300'],
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
    const email = `entitygraph_pool_${i}@loadtest.local`;
    const password = ENV.DEFAULT_PASSWORD;

    let token: string | null = null;
    const regRes = http.post(
      API_ENDPOINTS.AUTH.REGISTER,
      JSON.stringify({ email, name: `Entity Pool ${i}`, password }),
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
          name: `EntityGraph Bot ${i}`,
          description: 'Deep relations testing bot',
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
  const headers = AuthHelper.getAuthHeaders(ctx.token);

  const listRes = http.get(API_ENDPOINTS.BOTS.LIST, {
    headers,
    tags: { name: 'EntityGraph_Bots_List' },
  });

  check(listRes, {
    'bots list returns 200': (r) => r.status === 200,
  });

  const schemaRes = http.get(API_ENDPOINTS.BOTS.SCHEMA(ctx.botId), {
    headers,
    tags: { name: 'EntityGraph_Flow_Schema' },
  });

  check(schemaRes, {
    'schema returns 200': (r) => r.status === 200,
  });

  const detailsRes = http.get(API_ENDPOINTS.BOTS.DETAILS(ctx.botId), {
    headers,
    tags: { name: 'EntityGraph_Bot_Details' },
  });

  check(detailsRes, {
    'bot details returns 200': (r) => r.status === 200,
  });

  sleep(0.05);
}
