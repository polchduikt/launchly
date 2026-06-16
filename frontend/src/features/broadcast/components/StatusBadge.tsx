import React from 'react';
import {CheckCircle2, Loader2, Clock, AlertTriangle, Calendar,} from 'lucide-react';
import type { StatusBadgeProps } from '../types';

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-50">
          <CheckCircle2 size={12} />
          Completed
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 shadow-sm shadow-amber-50 animate-pulse">
          <Loader2 size={12} className="animate-spin" />
          In Progress
        </span>
      );
    case 'SCHEDULED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm shadow-indigo-50">
          <Clock size={12} />
          Scheduled
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 shadow-sm shadow-rose-50">
          <AlertTriangle size={12} />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100 shadow-sm shadow-slate-50">
          <Calendar size={12} />
          Draft
        </span>
      );
  }
};
