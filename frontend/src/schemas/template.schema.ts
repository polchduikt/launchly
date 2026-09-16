import { z } from 'zod';

export const templateWizardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must contain at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  description: z
    .string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .default(''),
  guideUrl: z
    .string()
    .trim()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: 'Guide URL must start with http:// or https://',
    })
    .optional()
    .default(''),
  videoUrl: z
    .string()
    .trim()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: 'Video URL must start with http:// or https://',
    })
    .optional()
    .default(''),
  isProtected: z.boolean().default(false),
});

export type TemplateWizardFormValues = z.infer<typeof templateWizardSchema>;
