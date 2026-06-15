import React from 'react';
import { Calendar, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import type { SubscriptionDetailsCardProps } from '../types';

export const SubscriptionDetailsCard: React.FC<SubscriptionDetailsCardProps> = ({
  subscription,
  onCancel,
  onResume,
  isCancelPending,
  isResumePending,
}) => {
  const { plan, status, cancelAtPeriodEnd, currentPeriodEnd } = subscription;
  const isFree = plan.name.toUpperCase() === 'FREE';

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'PAST_DUE':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'CANCELED':
      case 'UNPAID':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
            <Sparkles size={10} /> Active Subscription
          </span>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {plan.displayName} Plan
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
              status
            )}`}
          >
            {status}
          </span>
          {cancelAtPeriodEnd && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
              Pending Cancellation
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400">Price</span>
          <p className="text-base font-black text-slate-700">
            {isFree ? 'Free' : `$${plan.price} / month`}
          </p>
        </div>

        {!isFree && currentPeriodEnd && (
          <div className="space-y-1 col-span-2">
            <span className="text-xs font-bold text-slate-400">
              {cancelAtPeriodEnd ? 'Expires on' : 'Next billing date'}
            </span>
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <Calendar size={16} className="text-slate-400" />
              <span>{formatDate(currentPeriodEnd)}</span>
            </div>
          </div>
        )}
      </div>

      {cancelAtPeriodEnd && !isFree && (
        <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-800">
          <ShieldAlert className="shrink-0 text-amber-600" size={20} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold">Your subscription has been cancelled</h4>
            <p className="text-xs text-amber-700/90 leading-relaxed">
              You will continue to have access to your active plan limits until{' '}
              <span className="font-bold">{formatDate(currentPeriodEnd)}</span>. After this date,
              your workspace will be automatically downgraded to the Free tier.
            </p>
          </div>
        </div>
      )}

      {!isFree && (
        <div className="flex justify-end pt-4 border-t border-slate-50">
          {cancelAtPeriodEnd ? (
            <button
              onClick={onResume}
              disabled={isResumePending}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-slate-950/10 flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isResumePending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Resuming...</span>
                </>
              ) : (
                <span>Resume Subscription</span>
              )}
            </button>
          ) : (
            <button
              onClick={onCancel}
              disabled={isCancelPending}
              className="px-5 py-2.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isCancelPending ? (
                <>
                  <Loader2 size={12} className="animate-spin text-rose-600" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Cancel Subscription</span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
