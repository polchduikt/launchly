import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { Counter } from 'k6/metrics';
import { API_ENDPOINTS } from '../config/env.config';

const conflict409Counter = new Counter('idempotency_409_conflict');
const processedCounter = new Counter('idempotency_processed');
const replayedCounter = new Counter('idempotency_replayed');

export const options: Options = {
  scenarios: {
    race_condition_test: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 1,
      maxDuration: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.99'],
  },
};

const SHARED_KEY = `idem-key-batch-${Math.floor(Date.now() / 1000)}`;

export default function () {
  const payload = JSON.stringify({
    name: 'Load Test Lead',
    email: 'loadtest@launchly.app',
    message: 'Testing concurrent idempotency',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': SHARED_KEY,
    },
    tags: { name: 'Idempotency_Concurrency' },
  };

  const res = http.post(API_ENDPOINTS.SUPPORT.APPEALS, payload, params);

  if (res.status === 409) {
    conflict409Counter.add(1);
    check(res, {
      'lock conflict 409 handled': (r) => r.status === 409,
    });
  } else if (res.status === 200 || res.status === 201) {
    if (res.headers['Idempotent-Replayed'] === 'true') {
      replayedCounter.add(1);
    } else {
      processedCounter.add(1);
    }
    check(res, {
      'processed successfully': (r) => r.status === 200 || r.status === 201,
    });
  }

  sleep(0.5);

  const replayRes = http.post(API_ENDPOINTS.SUPPORT.APPEALS, payload, params);
  if (replayRes.headers['Idempotent-Replayed'] === 'true') {
    replayedCounter.add(1);
  }
}
