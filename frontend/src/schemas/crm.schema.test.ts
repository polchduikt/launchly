import { describe, it, expect } from 'vitest';
import { createContactSchema } from './crm.schema';

describe('CRM Validation Schemas', () => {
  it('accepts valid contact with firstName only', () => {
    const result = createContactSchema.safeParse({
      firstName: 'Sarah',
    });
    expect(result.success).toBe(true);
  });

  it('accepts contact with email and phone', () => {
    const result = createContactSchema.safeParse({
      firstName: 'Sarah',
      lastName: 'Connor',
      phone: '+1234567890',
      email: 'sarah@skynet.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email formats', () => {
    const result = createContactSchema.safeParse({
      firstName: 'Sarah',
      email: 'not-valid-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty firstName', () => {
    const result = createContactSchema.safeParse({
      firstName: '   ',
    });
    expect(result.success).toBe(false);
  });
});
