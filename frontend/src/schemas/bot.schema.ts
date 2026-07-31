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

export const customFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().default('Text'),
  description: z.string().optional(),
  folder: z.string().nullable().optional(),
});

export type CustomFieldSchemaType = z.infer<typeof customFieldSchema>;

export const automationFolderSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
});

export type AutomationFolderSchemaType = z.infer<typeof automationFolderSchema>;
