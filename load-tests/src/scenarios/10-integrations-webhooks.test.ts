import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS } from '../config/env.config';
import { STAGES, THRESHOLDS } from '../config/thresholds.config';

import { AuthHelper } from '../helpers/auth.helper';
import { ENV } from '../config/env.config';

export const options: Options = {
  stages: STAGES.LOAD,
  thresholds: THRESHOLDS.WEBHOOK,
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

  if (auth) {
    const listRes = http.get(API_ENDPOINTS.INTEGRATIONS.LIST, {
      headers: AuthHelper.getAuthHeaders(auth.token),
      tags: { name: 'Integrations_List' },
    });

    check(listRes, {
      'integrations list returns 200': (r) => r.status === 200,
    });
  }

  const hotmartPayload = {
    event: 'PURCHASE_APPROVED',
    data: {
      buyer: {
        email: `customer_${vuId}_${iter % 50}@gmail.com`,
        name: `Customer ${vuId}`,
        checkout_phone: `+38099${vuId}${iter % 100}`,
      },
      product: {
        id: 123456,
        name: 'Scale Masterclass',
      },
      purchase: {
        transaction: `HP_${vuId}_${iter}_${Date.now()}`,
        status: 'COMPLETE',
        price: {
          value: 99.0,
          currency_value: 'USD',
        },
      },
    },
  };

  const hotmartRes = http.post(
    API_ENDPOINTS.INTEGRATIONS.HOTMART_WEBHOOK(auth ? auth.botId : 1),
    JSON.stringify(hotmartPayload),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'test_webhook_token_mock',
      },
      tags: { name: 'Hotmart_Webhook_Ingestion' },
    }
  );

  check(hotmartRes, {
    'hotmart webhook response status is 200 or 400': (r) => r.status === 200 || r.status === 400,
  });

  sleep(1);
}
