import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS } from '../config/env.config';
import { STAGES, THRESHOLDS } from '../config/thresholds.config';
import { AuthHelper } from '../helpers/auth.helper';

export const options: Options = {
  stages: STAGES.LOAD,
  thresholds: THRESHOLDS.DATABASE_WRITE,
};

export default function () {
  const vuId = __VU;
  const email = `billing_vu_${vuId % 100}@launchly-loadtest.com`;
  const token = AuthHelper.register(email, `Billing User ${vuId % 100}`);

  if (!token) return;
  const authHeaders = AuthHelper.getAuthHeaders(token);

  const plansRes = http.get(API_ENDPOINTS.BILLING.PLANS, {
    headers: { 'Content-Type': 'application/json' },
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
    'subscription status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.5);
}
