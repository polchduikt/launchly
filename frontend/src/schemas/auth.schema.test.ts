import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  getLoginSchema,
  getRegisterSchema,
  type TranslateFn,
} from './auth.schema';

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'user@launchly.com',
        password: 'securePassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@launchly.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('accepts valid registration data with optional lastName', () => {
      const result = registerSchema.safeParse({
        email: 'founder@saas.com',
        password: 'longEnoughPassword',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
    });

    it('rejects passwords shorter than 6 characters', () => {
      const result = registerSchema.safeParse({
        email: 'founder@saas.com',
        password: '123',
        firstName: 'John',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty firstName', () => {
      const result = registerSchema.safeParse({
        email: 'founder@saas.com',
        password: 'password123',
        firstName: '   ',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('schema localization factories', () => {
    it('uses custom translator function for login error messages', () => {
      const mockT: TranslateFn = ((key: string) => `[localized:${key}]`) as TranslateFn;
      const customLoginSchema = getLoginSchema(mockT);

      const result = customLoginSchema.safeParse({
        email: 'invalid',
        password: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailErr = result.error.issues.find((i) => i.path[0] === 'email');
        const passErr = result.error.issues.find((i) => i.path[0] === 'password');
        expect(emailErr?.message).toBe('[localized:auth.invalid_email]');
        expect(passErr?.message).toBe('[localized:auth.password_required]');
      }
    });

    it('uses custom translator function for register error messages', () => {
      const mockT: TranslateFn = ((key: string) => `[localized:${key}]`) as TranslateFn;
      const customRegisterSchema = getRegisterSchema(mockT);

      const result = customRegisterSchema.safeParse({
        email: '',
        password: '123',
        firstName: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailErr = result.error.issues.find((i) => i.path[0] === 'email');
        const passErr = result.error.issues.find((i) => i.path[0] === 'password');
        const nameErr = result.error.issues.find((i) => i.path[0] === 'firstName');
        expect(emailErr?.message).toBe('[localized:auth.email_required]');
        expect(passErr?.message).toBe('[localized:auth.password_min_length]');
        expect(nameErr?.message).toBe('[localized:auth.firstname_required]');
      }
    });
  });
});
