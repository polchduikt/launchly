export const THRESHOLDS = {
  WEBHOOK: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<150', 'p(99)<300'],
  },
  AUTH: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<300', 'p(99)<600'],
  },
  DATABASE_WRITE: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200', 'p(99)<400'],
  },
  MASSIVE_FLOW_EXECUTION: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<250', 'p(99)<500'],
  },
};

export const STAGES = {
  SMOKE: [
    { duration: '5s', target: 5 },
    { duration: '10s', target: 5 },
    { duration: '5s', target: 0 },
  ],
  LOAD: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
  STRESS: [
    { duration: '30s', target: 200 },
    { duration: '1m', target: 1000 },
    { duration: '2m', target: 3000 },
    { duration: '1m', target: 5000 },
    { duration: '30s', target: 0 },
  ],
  SPIKE: [
    { duration: '10s', target: 50 },
    { duration: '1m', target: 3000 },
    { duration: '10s', target: 0 },
  ],
};
