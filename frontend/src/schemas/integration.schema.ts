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

export const stripeConfigSchema = z.object({
  connected: z.boolean().optional(),
  apiKey: z.string().optional(),
});

export type StripeConfigSchemaType = z.infer<typeof stripeConfigSchema>;

export const paypalConfigSchema = z.object({
  paypalClientId: z.string().optional(),
  paypalWebhookId: z.string().optional(),
  paypalLiveClientId: z.string().optional(),
  paypalLiveWebhookId: z.string().optional(),
  currency: z.string().optional(),
  notifyMessenger: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
  sendReceiptEmail: z.boolean().optional(),
});

export const mailchimpSchema = z.object({
  apiKey: z.string().min(1, t('settings.integrations.mailchimp.error_api_key', 'API Key is required')),
  listId: z.string().min(1, t('settings.integrations.mailchimp.error_list_id', 'Audience / List ID is required')),
  serverPrefix: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type MailchimpSchemaType = z.infer<typeof mailchimpSchema>;

export const hotmartSchema = z.object({
  hottok: z.string().min(1, t('settings.integrations.hotmart.error_hottok', 'Hottok verification token is required')),
  syncOrders: z.boolean().optional(),
  syncLeads: z.boolean().optional(),
});

export type HotmartSchemaType = z.infer<typeof hotmartSchema>;
