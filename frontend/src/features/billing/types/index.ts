export interface PlanResponse {
  id: number;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  maxBots: number;
  maxBotUsers: number;
  maxBroadcastsPerMonth: number;
  canUseBroadcast: boolean;
  canUseIntegrations: boolean;
  canUseAiAgent: boolean;
  canUsePayments: boolean;
}

export interface SubscriptionResponse {
  id: number;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: PlanResponse;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface CheckoutRequest {
  planId: number;
}

export interface PricingGridProps {
  plans: PlanResponse[];
  currentPlanId: number;
  onUpgrade: (planId: number) => void;
  isUpgradePending: boolean;
  upgradingPlanId: number | null;
}

export interface SubscriptionDetailsCardProps {
  subscription: SubscriptionResponse;
  onCancel: () => void;
  onResume: () => void;
  isCancelPending: boolean;
  isResumePending: boolean;
}
