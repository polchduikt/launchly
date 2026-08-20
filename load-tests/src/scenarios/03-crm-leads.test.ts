import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS } from '../config/env.config';
import { STAGES, THRESHOLDS } from '../config/thresholds.config';
import { AuthHelper } from '../helpers/auth.helper';
import { CrmHelper } from '../helpers/crm.helper';

export const options: Options = {
  stages: STAGES.LOAD,
  thresholds: THRESHOLDS.DATABASE_WRITE,
};

export default function () {
  const vuId = __VU;
  const iter = __ITER;
  const leadIndex = vuId * 10000 + iter;

  const email = `crm_owner_${vuId % 50}@launchly-loadtest.com`;
  const token = AuthHelper.register(email, `CRM Owner ${vuId % 50}`);

  if (!token) {
    return;
  }

  const authHeaders = AuthHelper.getAuthHeaders(token);

  const botsRes = http.get(API_ENDPOINTS.BOTS.LIST, {
    headers: authHeaders,
    tags: { name: 'CRM_List_Bots' },
  });

  let botId: string | null = null;
  if (botsRes.status === 200) {
    try {
      const bots = JSON.parse(botsRes.body as string);
      if (Array.isArray(bots) && bots.length > 0) {
        botId = bots[0].id;
      }
    } catch {}
  }

  if (!botId) {
    const createBotPayload = {
      name: `CRM Load Test Bot ${vuId}`,
      telegramBotUsername: `crm_load_bot_${vuId}_bot`,
      telegramBotToken: `999999999:TEST_TOKEN_${vuId}_${Date.now()}`,
    };
    const createBotRes = http.post(API_ENDPOINTS.BOTS.CREATE, JSON.stringify(createBotPayload), {
      headers: authHeaders,
      tags: { name: 'CRM_Create_Bot' },
    });
    if (createBotRes.status === 201 || createBotRes.status === 200) {
      try {
        const newBot = JSON.parse(createBotRes.body as string);
        botId = newBot.id;
      } catch {}
    }
  }

  if (botId) {
    const leadPayload = CrmHelper.createLeadPayload(leadIndex);
    const leadRes = http.post(API_ENDPOINTS.CRM.LEADS(botId), JSON.stringify(leadPayload), {
      headers: authHeaders,
      tags: { name: 'CRM_Create_Lead' },
    });

    check(leadRes, {
      'lead created (200 or 201)': (r) => r.status === 200 || r.status === 201,
      'lead has valid id': (r) => {
        try {
          const body = JSON.parse(r.body as string);
          return !!body.id;
        } catch {
          return false;
        }
      },
    });
  }

  sleep(0.5);
}
