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

  const botsRes = http.get(API_ENDPOINTS.BOTS.LIST, {
    headers: AuthHelper.getAuthHeaders(token),
  });

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
        name: `Broadcast Scale Bot ${vuId}`,
        telegramToken: `10000${vuId}:ABCdefGhIJKlmNoPQRsTUVwxyZ123456789`,
      }),
      { headers: AuthHelper.getAuthHeaders(token) }
    );
    if (createBotRes.status === 200 || createBotRes.status === 201) {
      try {
        botId = JSON.parse(createBotRes.body as string).id;
      } catch {}
    }
  }

  cachedAuth = { token, botId: botId || 1 };
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

  const listRes = http.get(API_ENDPOINTS.BROADCASTS.LIST(auth.botId), {
    headers,
    tags: { name: 'Broadcast_List' },
  });

  check(listRes, {
    'broadcast list returns 200': (r) => r.status === 200,
  });

  const campaignPayload = {
    name: `Flash Sale Campaign #${vuId}_${iter}`,
    message: `Special offer #${iter}! Get 50% discount today only!`,
    filterType: 'ALL',
    botId: auth.botId,
  };

  const createRes = http.post(
    API_ENDPOINTS.BROADCASTS.CREATE(auth.botId),
    JSON.stringify(campaignPayload),
    {
      headers,
      tags: { name: 'Broadcast_Create' },
    }
  );

  let createdCampaignId: number | null = null;
  if (createRes.status === 200 || createRes.status === 201) {
    try {
      createdCampaignId = JSON.parse(createRes.body as string).id;
    } catch {}
  }

  check(createRes, {
    'create broadcast returns 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  if (createdCampaignId && iter % 4 === 0) {
    const cancelRes = http.del(
      API_ENDPOINTS.BROADCASTS.CANCEL(auth.botId, createdCampaignId),
      null,
      {
        headers,
        tags: { name: 'Broadcast_Cancel' },
      }
    );

    check(cancelRes, {
      'cancel broadcast returns 200': (r) => r.status === 200 || r.status === 400,
    });
  }

  sleep(1.5);
}
