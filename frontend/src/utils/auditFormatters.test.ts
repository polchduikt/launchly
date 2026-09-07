import { describe, it, expect } from 'vitest';
import { formatAuditTitle, formatAuditDescription } from './auditFormatters';

describe('auditFormatters', () => {
  const mockT = (key: string, opts?: any) => {
    if (opts?.botName) return `${key}:${opts.botName}`;
    if (opts?.provider) return `${key}:${opts.provider}`;
    if (opts?.botId) return `${key}:${opts.botId}`;
    return key;
  };

  it('translates known audit titles', () => {
    expect(formatAuditTitle('Реєстрація у Launchly', undefined, mockT)).toBe('audit.user_registration.title');
    expect(formatAuditTitle('Bot Connected: MyBot', undefined, mockT)).toBe('audit.bot_connected.title:MyBot');
    expect(formatAuditTitle('User Authentication', undefined, mockT)).toBe('audit.user_auth.title');
  });

  it('translates known audit descriptions', () => {
    expect(formatAuditDescription('Account activated via GOOGLE', mockT)).toBe('audit.user_registration.desc:GOOGLE');
    expect(formatAuditDescription('Bot ID: #42 activated', mockT)).toBe('audit.bot_connected.desc:42');
  });
});
