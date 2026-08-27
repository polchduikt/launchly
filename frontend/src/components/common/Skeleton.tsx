import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      data-testid="skeleton"
      className={`animate-pulse bg-slate-300/80 rounded-lg ${className}`}
      {...props}
    />
  );
};

export const ConversationListSkeleton: React.FC = () => {
  return (
    <div className="w-full flex flex-col divide-y-2 divide-[#0A0A0A]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="w-full px-4 py-3 flex items-start gap-2.5 bg-[#F2EBDD] animate-pulse"
        >
          <div className="w-9 h-9 rounded-full bg-slate-300/80 shrink-0 border border-[#0A0A0A]/20" />
          <div className="flex-1 min-w-0 space-y-2 py-0.5">
            <div className="flex justify-between items-center">
              <div className="w-24 h-3 bg-slate-400/80 rounded" />
              <div className="w-8 h-2 bg-slate-300 rounded" />
            </div>
            <div className="w-40 h-2.5 bg-slate-300/90 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const MessageAreaSkeleton: React.FC = () => {
  return (
    <div className="flex-1 p-6 space-y-5 animate-pulse overflow-hidden bg-[#F2EBDD]">
      <div className="flex justify-center my-2">
        <div className="w-24 h-5 rounded-full bg-slate-300/80 border border-[#0A0A0A]/20" />
      </div>

      <div className="flex items-end gap-2 max-w-md">
        <div className="w-7 h-7 rounded-full bg-slate-300/80 shrink-0 border border-[#0A0A0A]/20" />
        <div className="w-56 h-14 rounded-2xl bg-white border-2 border-[#0A0A0A]/30 p-3 space-y-2">
          <div className="w-full h-2.5 bg-slate-300/80 rounded" />
          <div className="w-2/3 h-2 bg-slate-200 rounded" />
        </div>
      </div>

      <div className="flex items-end justify-end gap-2 max-w-md ml-auto">
        <div className="w-64 h-16 rounded-2xl bg-[#0A0A0A]/15 border-2 border-[#0A0A0A]/30 p-3 space-y-2">
          <div className="w-full h-2.5 bg-slate-400/80 rounded" />
          <div className="w-4/5 h-2 bg-slate-300/80 rounded" />
        </div>
        <div className="w-7 h-7 rounded-full bg-slate-400/80 shrink-0 border border-[#0A0A0A]/20" />
      </div>

      <div className="flex items-end gap-2 max-w-md">
        <div className="w-7 h-7 rounded-full bg-slate-300/80 shrink-0 border border-[#0A0A0A]/20" />
        <div className="w-48 h-12 rounded-2xl bg-white border-2 border-[#0A0A0A]/30 p-3 space-y-1.5">
          <div className="w-full h-2.5 bg-slate-300/80 rounded" />
          <div className="w-1/2 h-2 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="w-full bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl overflow-hidden animate-pulse">
      <div className="h-12 bg-white border-b-2 border-[#0A0A0A] flex items-center px-6 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-3 bg-slate-300/80 rounded" />
        ))}
      </div>
      <div className="divide-y divide-[#0A0A0A]/15">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-16 px-6 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-slate-300/80 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-32 h-3 bg-slate-400/80 rounded" />
              <div className="w-20 h-2 bg-slate-300 rounded" />
            </div>
            <div className="w-24 h-6 rounded-lg bg-slate-300/70 shrink-0" />
            <div className="w-28 h-3 bg-slate-300/80 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
