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

let cachedToken: string | null = null;

function ensureAuth(vuId: number): string | null {
  if (cachedToken) return cachedToken;

  const email = `billing_scale_${vuId}@launchly-scale.com`;
  const password = ENV.DEFAULT_PASSWORD;

  const loginRes = http.post(
    API_ENDPOINTS.AUTH.LOGIN,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status === 200) {
    try {
      cachedToken = JSON.parse(loginRes.body as string).accessToken;
      return cachedToken;
    } catch {}
  }

  cachedToken = AuthHelper.register(email, `Billing User ${vuId}`, password);
  return cachedToken;
}

export default function () {
  const vuId = __VU;
  const token = ensureAuth(vuId);

  if (!token) {
    sleep(1);
    return;
  }

  const authHeaders = AuthHelper.getAuthHeaders(token);

  const plansRes = http.get(API_ENDPOINTS.BILLING.PLANS, {
    headers: authHeaders,
    tags: { name: 'Billing_Get_Plans' },
  });

  check(plansRes, {
    'plans status is 200': (r) => r.status === 200,
    'plans list is non-empty': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return Array.isArray(body) && body.length > 0;
      } catch {
        return false;
      }
    },
  });

  const subRes = http.get(API_ENDPOINTS.BILLING.SUBSCRIPTION, {
    headers: authHeaders,
    tags: { name: 'Billing_Get_Subscription' },
  });

  check(subRes, {
    'subscription status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
