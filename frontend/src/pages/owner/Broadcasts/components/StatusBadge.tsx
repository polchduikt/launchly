import React from 'react';
import type { StatusBadgeProps } from '../../../../types';
import { t } from '../../../../i18n/config';

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'BLOCKED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300 shadow-xs">
          {t('status.blocked') || t('admin.status_blocked') || 'Blocked'}
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 shadow-xs">
          {t('status.cancelled') || t('admin.status_cancelled') || 'Cancelled'}
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-50">
          {t('status.completed') || 'Completed'}
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100 shadow-sm shadow-amber-50 animate-pulse">
          {t('status.in_progress') || 'In Progress'}
        </span>
      );
    case 'SCHEDULED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm shadow-indigo-50">
          {t('status.scheduled') || 'Scheduled'}
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-50 text-rose-700 border border-rose-100 shadow-sm shadow-rose-50">
          {t('status.failed') || 'Failed'}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-50 text-slate-700 border border-slate-100 shadow-sm shadow-slate-50">
          {t('status.draft') || 'Draft'}
        </span>
      );
  }
};
