import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

interface AdminFilterDropdownProps<T extends string = string> {
  label?: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

function AdminFilterDropdownInner<T extends string = string>({
  label,
  value,
  options,
  onChange,
  className = 'space-y-1',
}: AdminFilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const currentOption = options.find((opt) => opt.value === value);
  const displayLabel = currentOption ? currentOption.label : value;

  return (
    <div className={className} ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A] block">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown
            size={14}
            className={`text-current shrink-0 ml-1 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] z-50 py-1 font-['JetBrains_Mono',monospace] overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-bold uppercase flex items-center justify-between transition-colors cursor-pointer ${
                  value === opt.value
                    ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                    : 'text-[#0A0A0A] hover:bg-white'
                }`}
              >
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const AdminFilterDropdown = React.memo(AdminFilterDropdownInner) as typeof AdminFilterDropdownInner;
