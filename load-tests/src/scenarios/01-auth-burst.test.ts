import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS, ENV } from '../config/env.config';
import { STAGES, THRESHOLDS } from '../config/thresholds.config';
import { AuthHelper } from '../helpers/auth.helper';
import { LoginRequest } from '../types/auth.types';

export const options: Options = {
  stages: STAGES.LOAD,
  thresholds: THRESHOLDS.AUTH,
};

export default function () {
  const vuId = __VU;
  const iter = __ITER;
  const email = `owner_vu_${vuId}_${iter % 100}@launchly-test.com`;
  const password = ENV.DEFAULT_PASSWORD;

  const payload: LoginRequest = { email, password };
  const loginRes = http.post(API_ENDPOINTS.AUTH.LOGIN, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Auth_Login_Spike' },
  });

  let token: string | null = null;
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body as string);
      token = body.accessToken;
    } catch {}
  } else if (loginRes.status === 401 || loginRes.status === 404) {
    token = AuthHelper.register(email, `VU User ${vuId}`, password);
  }

  check(loginRes, {
    'auth response status is 200 or fallback': () => token !== null,
  });

  if (token) {
    const meRes = http.get(API_ENDPOINTS.AUTH.ME, {
      headers: AuthHelper.getAuthHeaders(token),
      tags: { name: 'Auth_Get_Me' },
    });

    check(meRes, {
      'get /me returns 200': (r) => r.status === 200,
      'profile has valid email': (r) => {
        try {
          const body = JSON.parse(r.body as string);
          return body.email === email;
        } catch {
          return false;
        }
      },
    });
  }

  sleep(0.5);
}
