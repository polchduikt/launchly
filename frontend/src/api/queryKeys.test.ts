import { describe, it, expect } from 'vitest';
import { queryKeys } from './queryKeys';

describe('queryKeys factory', () => {
  it('generates consistent bot query keys', () => {
    expect(queryKeys.bots.all).toEqual(['bots']);
    expect(queryKeys.bots.detail(5)).toEqual(['bot', 5]);
    expect(queryKeys.bots.schema(10)).toEqual(['bot_schema', 10]);
  });

  it('generates consistent crm query keys', () => {
    expect(queryKeys.crm.conversationsRoot).toEqual(['conversations']);
    expect(queryKeys.crm.conversations(7)).toEqual(['conversations', 7]);
    expect(queryKeys.crm.allConversations).toEqual(['conversations', 'all']);
    expect(queryKeys.crm.messages(42)).toEqual(['messages', 42]);
    expect(queryKeys.crm.leadsRoot).toEqual(['leads']);
    expect(queryKeys.crm.leads(3)).toEqual(['leads', 3]);
  });

  it('generates consistent admin query keys', () => {
    expect(queryKeys.admin.users).toEqual(['adminUsers']);
    expect(queryKeys.admin.supportTicketDetail(100)).toEqual(['adminSupportTicketDetail', 100]);
  });
});
