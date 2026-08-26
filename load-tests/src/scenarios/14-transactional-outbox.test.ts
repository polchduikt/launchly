import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS, ENV } from '../config/env.config';
import { AuthHelper } from '../helpers/auth.helper';

export const options: Options = {
  scenarios: {
    outbox_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 30,
      maxVUs: 100,
      stages: [
        { target: 30, duration: '10s' },
        { target: 60, duration: '15s' },
        { target: 10, duration: '5s' },
      ],
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
    http_req_duration: ['p(95)<200'],
  },
};

interface TestContext {
  token: string;
  botId: number;
}

export function setup(): TestContext {
  const email = 'outbox_runner@loadtest.local';
  const token = AuthHelper.register(email, 'Outbox Tester', ENV.DEFAULT_PASSWORD);

  if (!token) {
    throw new Error('Failed to authenticate outbox tester in setup');
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
        name: 'Outbox Load Bot',
        description: 'Bot for testing transactional outbox under load',
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
    throw new Error('Failed to obtain bot for outbox testing');
  }

  const intListRes = http.get(API_ENDPOINTS.INTEGRATIONS.LIST, { headers: authHeaders });
  let hasHotmart = false;
  if (intListRes.status === 200) {
    try {
      const ints = JSON.parse(intListRes.body as string);
      if (Array.isArray(ints)) {
        hasHotmart = ints.some((i: any) => i.type === 'HOTMART' && i.botId === botId);
      }
    } catch {}
  }

  if (!hasHotmart) {
    const createIntRes = http.post(
      API_ENDPOINTS.INTEGRATIONS.LIST,
      JSON.stringify({
        name: 'Hotmart Outbox Ingress',
        type: 'HOTMART',
        botId: botId,
        config: {
          hottok: 'test-secret-token',
          syncOrders: true,
          syncLeads: true,
        },
      }),
      { headers: authHeaders }
    );

    if (createIntRes.status !== 200 && createIntRes.status !== 201) {
      throw new Error(`Failed to create Hotmart integration: ${createIntRes.status} ${createIntRes.body}`);
    }
  }

  return {
    token,
    botId,
  };
}

export default function (data?: TestContext) {
  const ctx = data || setup();
  const iter = __ITER;
  const vuId = __VU;

  const hotmartPayload = {
    hottok: 'test-secret-token',
    event: iter % 2 === 0 ? 'PURCHASE_APPROVED' : 'PURCHASE_REFUNDED',
    data: {
      buyer: {
        name: `Buyer ${vuId} ${iter}`,
        email: `buyer_${vuId}_${iter}_${Date.now() % 10000}@example.com`,
        checkout_phone: '+380501234567',
      },
      product: {
        name: 'Enterprise SaaS Course',
      },
      purchase: {
        transaction: `TX_${vuId}_${iter}_${Date.now()}`,
        status: 'APPROVED',
        price: {
          value: 99.0,
          currency_value: 'USD',
        },
      },
    },
  };

  const webhookRes = http.post(
    API_ENDPOINTS.INTEGRATIONS.HOTMART_WEBHOOK(ctx.botId),
    JSON.stringify(hotmartPayload),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Hotmart-Hottok': 'test-secret-token',
      },
      tags: { name: 'Outbox_Webhook_Ingress' },
    }
  );

  check(webhookRes, {
    'webhook accepted': (r) => r.status === 200 || r.status === 202,
  });

  sleep(0.05);
}
