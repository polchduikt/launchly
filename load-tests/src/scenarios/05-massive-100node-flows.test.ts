import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS } from '../config/env.config';
import { THRESHOLDS } from '../config/thresholds.config';
import { AuthHelper } from '../helpers/auth.helper';
import { SchemaGenerator } from '../helpers/schema-generator';
import { TelegramHelper } from '../helpers/telegram.helper';
import { SaveFlowRequest } from '../types/flow.types';

export const options: Options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: THRESHOLDS.MASSIVE_FLOW_EXECUTION,
};

const COMPLEX_100_NODE_DIAGRAM = SchemaGenerator.generateComplexDiagram(100);

let cachedToken: string | null = null;

export default function () {
  const vuId = __VU;
  const iter = __ITER;

  const ownerEmail = `owner_scale_${vuId}@launchly-scale.com`;
  if (!cachedToken) {
    cachedToken = AuthHelper.register(ownerEmail, `Scale Owner ${vuId}`);
  }

  if (!cachedToken) {
    sleep(1);
    return;
  }
  const authHeaders = AuthHelper.getAuthHeaders(cachedToken);

  const automationIndex = iter + 1;
  const botIdTokenNum = String(100000000 + (vuId * 10000) + automationIndex);
  const botToken = `${botIdTokenNum}:ABCdefGhIJKlmNoPQRsTUVwxyZ123456789`;

  const createBotPayload = {
    name: `Enterprise 100-Node Bot ${vuId} - Auto #${automationIndex}`,
    telegramToken: botToken,
    description: 'Load test 100-node automation',
  };

  const createBotRes = http.post(API_ENDPOINTS.BOTS.CREATE, JSON.stringify(createBotPayload), {
    headers: authHeaders,
    tags: { name: 'Scale_Create_100Node_Bot' },
  });

  let botId: number | string | null = null;
  if (createBotRes.status === 201 || createBotRes.status === 200) {
    try {
      const bot = JSON.parse(createBotRes.body as string);
      botId = bot.id;
    } catch {}
  } else {
    const listRes = http.get(API_ENDPOINTS.BOTS.LIST, { headers: authHeaders });
    if (listRes.status === 200) {
      try {
        const list = JSON.parse(listRes.body as string);
        if (Array.isArray(list) && list.length > 0) {
          botId = list[0].id;
        }
      } catch {}
    }
  }

  if (botId) {
    const saveFlowRes = http.put(
      API_ENDPOINTS.BOTS.SCHEMA(botId),
      JSON.stringify(COMPLEX_100_NODE_DIAGRAM),
      {
        headers: authHeaders,
        tags: { name: 'Scale_Save_100Node_Diagram' },
      }
    );

    check(saveFlowRes, {
      '100-node diagram saved successfully (200 OK)': (r) => r.status === 200,
      'save latency < 300ms': (r) => r.timings.duration < 300,
    });
  }

  if (botId) {
    const telegramUserId = 8000000 + vuId;
    const updatePayload = TelegramHelper.createMessageUpdate(
      telegramUserId,
      '/start',
      telegramUserId,
      `Customer_${telegramUserId}`
    );

    const webhookRes = http.post(
      API_ENDPOINTS.TELEGRAM.WEBHOOK(botId),
      JSON.stringify(updatePayload),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'Scale_Execute_100Node_Flow' },
      }
    );

    check(webhookRes, {
      '100-node execution accepted (200 OK)': (r) => r.status === 200,
      'execution latency < 200ms': (r) => r.timings.duration < 200,
    });
  }

  sleep(1);
}
