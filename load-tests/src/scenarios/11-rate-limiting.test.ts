import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { Counter, Rate } from 'k6/metrics';
import { ENV } from '../config/env.config';

const rateLimit429Counter = new Counter('rate_limited_429_count');
const success200Counter = new Counter('success_200_count');
const rateLimitRate = new Rate('rate_limited_rate');

export const options: Options = {
  scenarios: {
    warmup_under_limit: {
      executor: 'constant-vus',
      vus: 5,
      duration: '5s',
      startTime: '0s',
    },
    spike_exceeding_limit: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { target: 150, duration: '10s' },
        { target: 200, duration: '10s' },
        { target: 10, duration: '5s' },
      ],
      startTime: '5s',
    },
  },
  thresholds: {
    rate_limited_rate: ['rate>0.50'],
    checks: ['rate==1.0'],
  },
};

export default function () {
  const vuId = __VU;
  const res = http.get(`${ENV.BASE_URL}/api/v1/blog`, {
    headers: {
      'Accept': 'application/json',
      'X-Forwarded-For': `192.168.1.${vuId % 5 + 1}`,
    },
    tags: { name: 'RateLimit_Blog' },
  });

  const isRateLimited = res.status === 429;
  const isSuccess = res.status === 200;

  rateLimitRate.add(isRateLimited);

  if (isRateLimited) {
    rateLimit429Counter.add(1);
    check(res, {
      'status is 429 on limit breach': (r) => r.status === 429,
    });
  } else if (isSuccess) {
    success200Counter.add(1);
    check(res, {
      'status is 200 within limit': (r) => r.status === 200,
    });
  }

  sleep(0.05);
}
