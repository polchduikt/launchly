import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  usePlansQuery,
  useSubscriptionQuery,
  useCheckoutMutation,
  useCancelSubscriptionMutation,
  useResumeSubscriptionMutation,
} from '../hooks/useBillingQueries';
import { SubscriptionDetailsCard } from './SubscriptionDetailsCard';
import { PricingGrid } from './PricingGrid';

export const SubscriptionsPanel: React.FC = () => {
  const {
    data: subscription,
    isLoading: isSubLoading,
    error: subError,
  } = useSubscriptionQuery();

  const {
    data: plans,
    isLoading: isPlansLoading,
    error: plansError,
  } = usePlansQuery();

  const checkoutMutation = useCheckoutMutation();
  const cancelMutation = useCancelSubscriptionMutation();
  const resumeMutation = useResumeSubscriptionMutation();

  const [upgradingPlanId, setUpgradingPlanId] = useState<number | null>(null);

  const handleUpgrade = (planId: number) => {
    setUpgradingPlanId(planId);
    checkoutMutation.mutate(planId, {
      onSuccess: (data) => {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      },
      onError: () => {
        setUpgradingPlanId(null);
      },
    });
  };

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  const handleResume = () => {
    resumeMutation.mutate();
  };

  const isLoading = isSubLoading || isPlansLoading;
  const error = subError || plansError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[300px]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="text-xs font-bold text-slate-400">Loading subscription billing workspace...</span>
      </div>
    );
  }

  if (error || !subscription || !plans) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-3xl flex items-start gap-3 max-w-md mx-auto shadow-sm">
        <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm">Failed to load billing workspace</h3>
          <p className="text-xs text-rose-700/90 leading-relaxed">
            {error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <SubscriptionDetailsCard
        subscription={subscription}
        onCancel={handleCancel}
        onResume={handleResume}
        isCancelPending={cancelMutation.isPending}
        isResumePending={resumeMutation.isPending}
      />

      <PricingGrid
        plans={plans}
        currentPlanId={subscription.plan.id}
        onUpgrade={handleUpgrade}
        isUpgradePending={checkoutMutation.isPending}
        upgradingPlanId={upgradingPlanId}
      />
    </div>
  );
};
