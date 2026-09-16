import { z } from 'zod';
import { t as defaultT } from '../i18n/config';

export type TranslateFn = typeof defaultT;

export const getLoginSchema = (t: TranslateFn = defaultT) =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, t('auth.email_required'))
      .email(t('auth.invalid_email')),
    password: z
      .string()
      .min(1, t('auth.password_required')),
  });

export const loginSchema = getLoginSchema();
export type LoginSchemaType = z.infer<typeof loginSchema>;

export const getRegisterSchema = (t: TranslateFn = defaultT) =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, t('auth.email_required'))
      .email(t('auth.invalid_email')),
    password: z
      .string()
      .min(6, t('auth.password_min_length')),
    firstName: z
      .string()
      .trim()
      .min(1, t('auth.firstname_required')),
    lastName: z.string().trim().optional(),
  });

export const registerSchema = getRegisterSchema();
export type RegisterSchemaType = z.infer<typeof registerSchema>;
