import { z } from 'zod';
import { t } from '../i18n/config';

export const botSchema = z.object({
  botName: z
    .string()
    .trim()
    .min(1, t('automations.create.error_name'))
    .max(100, t('automations.create.error_name_long')),
  botDesc: z
    .string()
    .trim()
    .max(500, t('automations.create.error_desc_long'))
    .optional(),
  botToken: z
    .string()
    .trim()
    .min(1, t('automations.create.error_token')),
});

export type BotSchemaType = z.infer<typeof botSchema>;
