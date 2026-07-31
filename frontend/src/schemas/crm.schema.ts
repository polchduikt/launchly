import { z } from 'zod';
import { t } from '../i18n/config';

export const createContactSchema = z.object({
  firstName: z.string().trim().min(1, t('crm.contacts.create.error_firstname')),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .email(t('crm.contacts.create.error_email'))
    .optional()
    .or(z.literal('')),
  gender: z.string().optional(),
});

export type CreateContactSchemaType = z.infer<typeof createContactSchema>;
