import { describe, it, expect } from 'vitest';
import { createBroadcastSchema } from '../broadcast.schema';

describe('Broadcast Validation Schemas', () => {
  it('accepts valid broadcast targeting all subscribers', () => {
    const result = createBroadcastSchema.safeParse({
      name: 'Spring Sale Announcement',
      message: 'Exclusive 20% discount on all courses!',
      filterType: 'ALL',
    });
    expect(result.success).toBe(true);
  });

  it('requires filterValue when filterType is BY_TAG', () => {
    const invalidResult = createBroadcastSchema.safeParse({
      name: 'VIP Broadcast',
      message: 'Hello VIPs',
      filterType: 'BY_TAG',
      filterValue: '',
    });
    expect(invalidResult.success).toBe(false);

    const validResult = createBroadcastSchema.safeParse({
      name: 'VIP Broadcast',
      message: 'Hello VIPs',
      filterType: 'BY_TAG',
      filterValue: 'VIP_CUSTOMER',
    });
    expect(validResult.success).toBe(true);
  });

  it('rejects empty broadcast name or message', () => {
    const result = createBroadcastSchema.safeParse({
      name: '',
      message: '',
      filterType: 'ALL',
    });
    expect(result.success).toBe(false);
  });
});
