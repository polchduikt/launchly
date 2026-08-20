import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '../auth.schema';

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
});
