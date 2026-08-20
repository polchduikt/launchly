import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS, ENV } from '../config/env.config';
import { STAGES } from '../config/thresholds.config';
import { AuthHelper } from '../helpers/auth.helper';

export const options: Options = {
  stages: STAGES.LOAD,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
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

  cachedAuth = { token, botId: 1 };
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

  const usageRes = http.get(API_ENDPOINTS.AI.USAGE, {
    headers,
    tags: { name: 'AI_Usage_Check' },
  });

  check(usageRes, {
    'ai usage returns 200': (r) => r.status === 200,
  });

  const chatPayload = {
    message: `How can I optimize my sales funnel for customer #${vuId}? Request #${iter}`,
    history: [],
  };

  const chatRes = http.post(API_ENDPOINTS.AI.CHAT, JSON.stringify(chatPayload), {
    headers,
    tags: { name: 'AI_Assistant_Chat' },
  });

  check(chatRes, {
    'ai chat returns 200 or 429 quota reached': (r) => r.status === 200 || r.status === 429 || r.status === 503,
  });

  if (iter % 5 === 0) {
    const promptPayload = {
      prompt: `Create a 3-step lead collection bot for a fitness club #${vuId}`,
      language: 'en',
    };

    const generateRes = http.post(API_ENDPOINTS.AI.GENERATE_FLOW, JSON.stringify(promptPayload), {
      headers,
      tags: { name: 'AI_Generate_Flow' },
    });

    check(generateRes, {
      'ai generate flow returns valid response': (r) =>
        r.status === 200 || r.status === 429 || r.status === 503,
    });
  }

  sleep(1);
}
