import { z } from 'zod';
import { t } from '../i18n/config';

export const webhookSchema = z.object({
  url: z
    .string()
    .url(t('settings.integrations.webhook.error_url'))
    .regex(/^https?:\/\/.*/, t('settings.integrations.webhook.error_url_prefix')),
  events: z
    .array(z.enum(['ORDER_CREATED', 'LEAD_CREATED']))
    .min(1, t('settings.integrations.webhook.error_events')),
  secret: z.string().optional(),
});

export type WebhookSchemaType = z.infer<typeof webhookSchema>;
