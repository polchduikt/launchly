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

let cachedAuth: { token: string; ticketId: number | null } | null = null;

function ensureAuth(vuId: number): { token: string; ticketId: number | null } | null {
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

  cachedAuth = { token, ticketId: null };
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

  if (!auth.ticketId || iter % 10 === 0) {
    const ticketPayload = {
      subject: `Billing question from VU #${vuId} (ticket #${iter})`,
      message: `Hello support, I have a question regarding billing upgrades for scale test account #${vuId}.`,
    };

    const createRes = http.post(API_ENDPOINTS.SUPPORT.TICKETS, JSON.stringify(ticketPayload), {
      headers,
      tags: { name: 'Support_Create_Ticket' },
    });

    check(createRes, {
      'support ticket created (200 or 201)': (r) => r.status === 200 || r.status === 201,
    });

    if (createRes.status === 200 || createRes.status === 201) {
      try {
        const body = JSON.parse(createRes.body as string);
        auth.ticketId = body.id || (body.ticket && body.ticket.id);
      } catch {}
    }
  }

  const ticketsRes = http.get(API_ENDPOINTS.SUPPORT.TICKETS, {
    headers,
    tags: { name: 'Support_Tickets_List' },
  });

  check(ticketsRes, {
    'support tickets list returns 200': (r) => r.status === 200,
  });

  if (auth.ticketId) {
    const msgPayload = {
      text: `Follow-up message #${iter} from customer #${vuId} at timestamp ${Date.now()}`,
    };

    const msgRes = http.post(
      API_ENDPOINTS.SUPPORT.MESSAGES(auth.ticketId),
      JSON.stringify(msgPayload),
      {
        headers,
        tags: { name: 'Support_Send_Message' },
      }
    );

    check(msgRes, {
      'send support message returns 200 or 201': (r) => r.status === 200 || r.status === 201,
    });
  }

  sleep(1);
}
