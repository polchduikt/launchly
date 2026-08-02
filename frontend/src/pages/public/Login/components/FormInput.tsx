import { forwardRef } from 'react';
import type { FormInputProps } from '../../../../types';

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, error, registration, rightElement, className = '', ...props }, ref) => {
    return (
      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5" htmlFor={props.id}>
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#0A0A0A]/50">
              {icon}
            </div>
          )}
          <input
            {...props}
            {...registration}
            ref={(e) => {
              if (ref) {
                if (typeof ref === 'function') {
                  ref(e);
                } else {
                  ref.current = e;
                }
              }
              if (registration.ref) {
                registration.ref(e);
              }
            }}
            className={`block w-full ${icon ? 'pl-10' : 'pl-3'} ${
              rightElement ? 'pr-10' : 'pr-3'
            } py-2.5 border-2 rounded-xl bg-white text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/15 transition-all text-sm font-bold ${
              error ? 'border-rose-500' : 'border-[#0A0A0A]'
            } ${className}`}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-rose-700 text-xs font-bold">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
