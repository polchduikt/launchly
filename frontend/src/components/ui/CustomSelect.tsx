import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
  'data-testid': testId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  return (
    <div ref={containerRef} className={`relative ${className}`} data-testid={testId}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-2.5 rounded-xl border-2 border-ink text-xs font-bold text-ink bg-white flex items-center justify-between transition-all cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-ink'
        } ${isOpen ? 'ring-2 ring-ink/20' : ''}`}
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-ink transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-canvas border-2 border-ink rounded-xl shadow-brutal py-1 z-50 max-h-56 overflow-y-auto font-['JetBrains_Mono',monospace]">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs font-bold transition-all cursor-pointer block truncate ${
                  isSelected
                    ? 'bg-ink text-canvas'
                    : 'text-ink hover:bg-ink hover:text-canvas'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
