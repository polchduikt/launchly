import { describe, it, expect } from 'vitest';
import { botSchema, customFieldSchema, automationFolderSchema } from '../bot.schema';

describe('Bot Validation Schemas', () => {
  describe('botSchema', () => {
    it('accepts valid bot configuration', () => {
      const result = botSchema.safeParse({
        botName: 'Sales Assistant',
        botDesc: 'Handles customer support and lead qualification',
        botToken: '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ123456789',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty bot token', () => {
      const result = botSchema.safeParse({
        botName: 'Sales Assistant',
        botToken: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects description longer than 500 characters', () => {
      const longDesc = 'a'.repeat(501);
      const result = botSchema.safeParse({
        botName: 'Bot',
        botDesc: longDesc,
        botToken: '123456:validToken',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('customFieldSchema', () => {
    it('defaults type to Text if not specified', () => {
      const result = customFieldSchema.parse({
        name: 'Lead Source',
      });
      expect(result.type).toBe('Text');
    });

    it('rejects empty name', () => {
      const result = customFieldSchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('automationFolderSchema', () => {
    it('accepts valid folder with id and name', () => {
      const result = automationFolderSchema.safeParse({
        id: 'folder-1',
        name: 'Onboarding Flows',
      });
      expect(result.success).toBe(true);
    });
  });
});
