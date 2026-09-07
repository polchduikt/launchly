import React from 'react';
import { Search } from 'lucide-react';

interface AdminSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const AdminSearchBar: React.FC<AdminSearchBarProps> = React.memo(({
  value,
  onChange,
  placeholder = 'Search...',
  className = 'relative w-full',
}) => {
  return (
    <div className={className}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A0A0A]" size={15} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder-slate-400 focus:outline-none shadow-[2px_2px_0px_#0A0A0A]"
      />
    </div>
  );
});
