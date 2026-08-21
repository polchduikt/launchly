import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PricingGrid } from './PricingGrid';

const mockPlans = [
  {
    id: 1,
    name: 'Free',
    displayName: 'Free Plan',
    price: 0,
    currency: 'USD',
    maxBots: 1,
    maxBotUsers: 100,
    maxBroadcastsPerMonth: 100,
    canUseBroadcast: false,
    canUseIntegrations: false,
    canUseAiAgent: false,
    canUsePayments: false,
  },
  {
    id: 2,
    name: 'Pro',
    displayName: 'Pro Plan',
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
];

describe('PricingGrid', () => {
  it('renders pricing grid with plans', () => {
    render(
      <PricingGrid
        plans={mockPlans}
        currentPlanId={1}
        onUpgrade={() => {}}
        isUpgradePending={false}
        upgradingPlanId={null}
      />
    );
    expect(screen.getByText('Available Plans')).toBeInTheDocument();
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
  });
});
