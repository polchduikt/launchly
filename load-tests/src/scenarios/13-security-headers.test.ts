import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { ENV } from '../config/env.config';

export const options: Options = {
  vus: 10,
  duration: '10s',
  thresholds: {
    checks: ['rate==1.0'],
    http_req_duration: ['p(95)<150'],
  },
};

export default function () {
  const vuId = __VU;
  const res = http.get(`${ENV.BASE_URL}/api/v1/blog`, {
    headers: {
      'X-Forwarded-For': `10.0.${vuId}.${(__ITER % 50) + 1}`,
    },
    tags: { name: 'Security_Headers_Check' },
  });

  check(res, {
    'status is valid (200 or 429)': (r) => r.status === 200 || r.status === 429,
    'has X-Content-Type-Options: nosniff': (r) => r.headers['X-Content-Type-Options'] === 'nosniff',
    'has X-Frame-Options: SAMEORIGIN': (r) => r.headers['X-Frame-Options'] === 'SAMEORIGIN',
    'has Referrer-Policy': (r) => r.headers['Referrer-Policy'] === 'strict-origin-when-cross-origin',
    'has Permissions-Policy': (r) => !!r.headers['Permissions-Policy'],
  });

  sleep(0.05);
}
