import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { Rate } from 'k6/metrics';
import { API_ENDPOINTS, ENV } from '../config/env.config';
import { AuthHelper } from '../helpers/auth.helper';

const rateLimitEnforced = new Rate('rate_limited_tier_enforced');

export const options: Options = {
  scenarios: {
    free_tier_load: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '15s',
      preAllocatedVUs: 20,
      maxVUs: 40,
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
    http_req_duration: ['p(95)<150'],
  },
};

interface TestContext {
  token: string;
}

export function setup(): TestContext {
  const email = 'tier_perf_tester@launchly.com';
  const password = ENV.DEFAULT_PASSWORD;

  const regRes = http.post(
    API_ENDPOINTS.AUTH.REGISTER,
    JSON.stringify({ email, name: 'Tier Tester', password }),
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
    throw new Error('Failed to authenticate in setup for tier rate limit test');
  }

  return { token };
}

export default function (data?: TestContext) {
  const ctx = data || setup();
  const headers = AuthHelper.getAuthHeaders(ctx.token);

  const plansRes = http.get(API_ENDPOINTS.BILLING.PLANS, {
    headers,
    tags: { name: 'Tier_RateLimit_Plans' },
  });

  const isAllowed = plansRes.status === 200;
  const isThrottled = plansRes.status === 429;

  rateLimitEnforced.add(isThrottled);

  check(plansRes, {
    'response status is 200 or 429': () => isAllowed || isThrottled,
  });

  sleep(0.05);
}
