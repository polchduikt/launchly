import React from 'react';
import { Loader2 } from 'lucide-react';

interface AdminDataTableProps {
  isLoading: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}

export const AdminDataTable: React.FC<AdminDataTableProps> = React.memo(({
  isLoading,
  isEmpty = false,
  emptyMessage = 'No data available',
  children,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-[#0A0A0A]" size={32} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 font-bold">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {children}
    </div>
  );
});
