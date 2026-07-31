import { z } from 'zod';
import { t } from '../i18n/config';

export const createBroadcastSchema = z
  .object({
    name: z.string().trim().min(1, t('broadcasts.create.error_name')),
    message: z.string().trim().min(1, t('broadcasts.create.error_message')),
    filterType: z.enum(['ALL', 'BY_TAG', 'HAS_ORDERS', 'HAS_LEADS']),
    filterValue: z.string().optional(),
    scheduledAt: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.filterType === 'BY_TAG' && !data.filterValue) {
        return false;
      }
      return true;
    },
    {
      message: t('broadcasts.create.error_tag_required'),
      path: ['filterValue'],
    }
  );

export type CreateBroadcastSchemaType = z.infer<typeof createBroadcastSchema>;
