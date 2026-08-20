import { Options } from 'k6/options';
import authBurst from './01-auth-burst.test';
import telegramSurge from './02-telegram-surge.test';
import crmLeads from './03-crm-leads.test';
import massive100Node from './05-massive-100node-flows.test';

export const options: Options = {
  scenarios: {
    auth_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 50 },
        { duration: '40s', target: 200 },
        { duration: '20s', target: 0 },
      ],
      exec: 'runAuth',
    },
    telegram_webhook_traffic: {
      executor: 'constant-arrival-rate',
      rate: 1000,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 100,
      maxVUs: 1000,
      exec: 'runTelegram',
    },
    crm_lead_concurrency: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 20,
      maxDuration: '1m',
      exec: 'runCrm',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<250'],
  },
};

export function runAuth() {
  authBurst();
}

export function runTelegram() {
  telegramSurge();
}

export function runCrm() {
  crmLeads();
}

export default function () {
  massive100Node();
}
