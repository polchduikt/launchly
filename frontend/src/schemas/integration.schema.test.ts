import { describe, it, expect } from 'vitest';
import { webhookSchema, mailchimpSchema, hotmartSchema } from './integration.schema';

describe('Integration Validation Schemas', () => {
  describe('webhookSchema', () => {
    it('accepts valid https webhook URL and events', () => {
      const result = webhookSchema.safeParse({
        url: 'https://api.myapp.com/webhooks/orders',
        events: ['ORDER_CREATED'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid or non-http URLs', () => {
      const result = webhookSchema.safeParse({
        url: 'ftp://invalid-protocol.com',
        events: ['ORDER_CREATED'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty events array', () => {
      const result = webhookSchema.safeParse({
        url: 'https://api.myapp.com/webhook',
        events: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('mailchimpSchema', () => {
    it('accepts valid API key and listId', () => {
      const result = mailchimpSchema.safeParse({
        apiKey: 'md-abc123xyz-us1',
        listId: 'audience_list_456',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing API key', () => {
      const result = mailchimpSchema.safeParse({
        apiKey: '',
        listId: 'audience_list_456',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('hotmartSchema', () => {
    it('accepts valid hottok', () => {
      const result = hotmartSchema.safeParse({
        hottok: 'hotmart_hottok_secret_token_123',
        syncOrders: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty hottok', () => {
      const result = hotmartSchema.safeParse({
        hottok: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
