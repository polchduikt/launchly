import { forwardRef } from 'react';
import type { FormInputProps } from '../types';

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon, error, registration, rightElement, className = '', ...props }, ref) => {
    return (
      <div>
        <label className="block text-sm font-bold text-on-surface mb-1.5" htmlFor={props.id}>
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
            } py-2.5 border rounded bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm ${
              error ? 'border-red-300' : 'border-outline-variant/60'
            } ${className}`}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-red-500 text-xs font-medium">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
