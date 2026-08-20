import http from 'k6/http';
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { API_ENDPOINTS, ENV } from '../config/env.config';
import { STAGES, THRESHOLDS } from '../config/thresholds.config';
import { TelegramHelper } from '../helpers/telegram.helper';

export const options: Options = {
  stages: STAGES.STRESS,
  thresholds: THRESHOLDS.WEBHOOK,
};

export default function () {
  const vuId = __VU;
  const iter = __ITER;
  const telegramUserId = 5000000 + (vuId * 1000) + (iter % 1000);
  const botToken = ENV.TELEGRAM_SYSTEM_TOKEN;

  const isCallback = iter % 3 === 0;
  const isStart = iter % 5 === 0;

  let updatePayload;
  if (isCallback) {
    updatePayload = TelegramHelper.createCallbackQueryUpdate(telegramUserId, `btn_step_${iter % 20}_click`);
  } else if (isStart) {
    updatePayload = TelegramHelper.createMessageUpdate(telegramUserId, '/start');
  } else {
    updatePayload = TelegramHelper.createMessageUpdate(
      telegramUserId,
      `Hello bot! I am customer #${telegramUserId} asking about product query ${iter}.`
    );
  }

  const res = http.post(API_ENDPOINTS.TELEGRAM.WEBHOOK(botToken), JSON.stringify(updatePayload), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Telegram_Webhook_Ingestion' },
  });

  check(res, {
    'webhook accepted (200 OK)': (r) => r.status === 200,
    'latency under 200ms': (r) => r.timings.duration < 200,
  });

  sleep(0.1);
}
