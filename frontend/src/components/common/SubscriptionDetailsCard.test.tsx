import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionDetailsCard } from './SubscriptionDetailsCard';
import type { SubscriptionResponse } from '../../types';

const mockSub: SubscriptionResponse = {
  id: 1,
  currentPeriodStart: '2023-01-01T00:00:00Z',
  plan: {
    id: 2,
    name: 'Pro',
    displayName: 'Pro',
    price: 19,
    currency: 'USD',
    maxBots: 5,
    maxBotUsers: 1000,
    maxBroadcastsPerMonth: 1000,
    canUseBroadcast: true,
    canUseIntegrations: true,
    canUseAiAgent: true,
    canUsePayments: true,
  },
  status: 'ACTIVE',
  cancelAtPeriodEnd: false,
  currentPeriodEnd: '2023-12-31T00:00:00Z',
};

describe('SubscriptionDetailsCard', () => {
  it('renders subscription details card', () => {
    render(
      <SubscriptionDetailsCard
        subscription={mockSub}
        onCancel={() => {}}
        onResume={() => {}}
        isCancelPending={false}
        isResumePending={false}
      />
    );
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });
});
